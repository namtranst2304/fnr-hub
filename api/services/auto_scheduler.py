"""
Auto Scheduler — Background jobs for auto-scraping and auto-posting.

Uses APScheduler to run two recurring jobs:
1. auto_scrape_job: Checks active SourcePages and scrapes new posts
2. auto_post_job: Publishes scheduled posts that are due

The scheduler is started/stopped via FastAPI lifespan events.
"""
import os
import logging
from datetime import datetime, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("auto_scheduler")
logging.basicConfig(level=logging.INFO)

# Singleton scheduler instance
scheduler = BackgroundScheduler(timezone="UTC")


# ──────────────────────────────────────────────
# Job 1: Auto Scrape
# ──────────────────────────────────────────────

def auto_scrape_job():
    """
    Runs periodically. For each active SourcePage:
    - Scrape latest posts via Playwright
    - Rewrite with AI
    - Save to DB
    """
    from services.db import get_auto_config, get_active_source_pages, update_source_last_scraped, insert_scraped_post
    from services.scraper_job import scrape_with_playwright, rewrite_text_with_ai, extract_post_id

    try:
        config = get_auto_config()
        if not config.get("autoScrapeOn", False):
            logger.info("[Auto Scrape] Disabled in config — skipping.")
            return

        sources = get_active_source_pages()
        if not sources:
            logger.info("[Auto Scrape] No active source pages.")
            return

        for source in sources:
            try:
                logger.info(f"[Auto Scrape] Scraping: {source['name']} ({source['url']})")

                # Scrape the page
                original_text = scrape_with_playwright(source["url"])

                if not original_text or len(original_text.strip()) < 20:
                    logger.warning(f"[Auto Scrape] No valid content from {source['name']}")
                    continue

                # Generate a source post ID from the URL
                source_post_id = f"auto_{source['id']}_{extract_post_id(source['url'])}_{int(datetime.now(timezone.utc).timestamp())}"

                # Rewrite with AI
                rewritten = rewrite_text_with_ai(original_text)

                # Save to DB
                new_id = insert_scraped_post(
                    source_post_id=source_post_id,
                    original_text=original_text,
                    rewritten_text=rewritten,
                    source_page_id=source["id"]
                )

                if new_id:
                    logger.info(f"[Auto Scrape] Saved new post #{new_id} from {source['name']}")
                else:
                    logger.info(f"[Auto Scrape] Duplicate or failed for {source['name']}")

                # Update last scraped timestamp
                update_source_last_scraped(source["id"])

            except Exception as e:
                logger.error(f"[Auto Scrape] Error scraping {source['name']}: {e}")

    except Exception as e:
        logger.error(f"[Auto Scrape] Fatal error: {e}")


# ──────────────────────────────────────────────
# Job 2: Auto Post
# ──────────────────────────────────────────────

def auto_post_job():
    """
    Runs every minute. Checks for SCHEDULED posts where scheduledAt <= now.
    Posts them to Facebook and updates status.
    
    NOTE: Current schedule-fb route uses FB's scheduled_publish_time,
    so FB handles the timing. This job is for posts scheduled via "Auto Queue"
    where we want to control timing ourselves (published=true, post immediately).
    """

    from services.db import get_auto_config, get_posts_ready_to_publish, update_post_status

    try:
        config = get_auto_config()
        if not config.get("autoPostOn", False):
            return  # Silent skip — this runs every minute

        posts = get_posts_ready_to_publish()
        if not posts:
            return



        from services.facebook_service import publish_post_immediately

        for post in posts:
            try:
                text_to_post = post.get("rewrittenText") or post.get("originalText", "")
                if not text_to_post:
                    logger.warning(f"[Auto Post] Post #{post['id']} has no text — skipping.")
                    continue

                logger.info(f"[Auto Post] Publishing post #{post['id']}...")

                # Post immediately to Facebook using shared service
                result = publish_post_immediately(text_to_post)

                if "id" in result:
                    update_post_status(post["id"], "POSTED", fb_post_id=result["id"])
                    logger.info(f"[Auto Post] ✅ Post #{post['id']} published! FB ID: {result['id']}")
                else:
                    error_msg = result.get("error", {}).get("message", str(result))
                    update_post_status(post["id"], "FAILED")
                    logger.error(f"[Auto Post] ❌ Post #{post['id']} failed: {error_msg}")

            except Exception as e:
                update_post_status(post["id"], "FAILED")
                logger.error(f"[Auto Post] Error posting #{post['id']}: {e}")

    except Exception as e:
        logger.error(f"[Auto Post] Fatal error: {e}")


# ──────────────────────────────────────────────
# Scheduler lifecycle
# ──────────────────────────────────────────────

def start_scheduler():
    """Start the background scheduler with both jobs."""
    if scheduler.running:
        logger.info("[Scheduler] Already running.")
        return

    # Auto Scrape: every 5 minutes (the job itself checks per-source intervals)
    scheduler.add_job(
        auto_scrape_job,
        trigger=IntervalTrigger(minutes=5),
        id="auto_scrape",
        name="Auto Scrape Job",
        replace_existing=True,
        max_instances=1,
    )

    # Auto Post: every 1 minute
    scheduler.add_job(
        auto_post_job,
        trigger=IntervalTrigger(minutes=1),
        id="auto_post",
        name="Auto Post Job",
        replace_existing=True,
        max_instances=1,
    )

    scheduler.start()
    logger.info("[Scheduler] 🚀 Started with auto_scrape (5m) and auto_post (1m) jobs.")


def stop_scheduler():
    """Gracefully stop the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("[Scheduler] Stopped.")


def get_scheduler_status() -> dict:
    """Get current status of the scheduler and its jobs."""
    jobs = []
    if scheduler.running:
        for job in scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run": str(job.next_run_time) if job.next_run_time else None,
            })

    return {
        "running": scheduler.running,
        "jobs": jobs,
    }
