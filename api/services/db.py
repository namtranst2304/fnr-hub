"""
Centralized database helpers for the FastAPI backend.
Uses psycopg2 with the same DATABASE_URL from .env.
"""

import os
from contextlib import contextmanager
from typing import Optional

import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
if "?schema=" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.split("?schema=")[0]


@contextmanager
def get_connection():
    """Context manager that yields a psycopg2 connection and auto-closes."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        conn.close()


# ──────────────────────────────────────────────
# SourcePage helpers
# ──────────────────────────────────────────────


def get_active_source_pages() -> list[dict]:
    """Return all SourcePages where isActive = true."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                'SELECT * FROM "SourcePage" WHERE "isActive" = TRUE ORDER BY id'
            )
            return [dict(row) for row in cur.fetchall()]


def get_all_source_pages() -> list[dict]:
    """Return all SourcePages."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute('SELECT * FROM "SourcePage" ORDER BY id DESC')
            return [dict(row) for row in cur.fetchall()]


def create_source_page(url: str, name: str, interval: int = 30) -> dict:
    """Insert a new SourcePage and return it."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """INSERT INTO "SourcePage" ("url", "name", "interval", "isActive", "lastScraped", "createdAt", "updatedAt")
                   VALUES (%s, %s, %s, TRUE, NULL, NOW(), NOW())
                   RETURNING *""",
                (url, name, interval),
            )
            conn.commit()
            return dict(cur.fetchone())


def update_source_page(source_id: int, data: dict) -> Optional[dict]:
    """Update a SourcePage by id. `data` can include: name, url, interval, isActive."""
    set_clauses = []
    values = []
    for key in ("name", "url", "interval", "isActive"):
        if key in data:
            set_clauses.append(f'"{key}" = %s')
            values.append(data[key])
    if not set_clauses:
        return None
    set_clauses.append('"updatedAt" = NOW()')
    values.append(source_id)

    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                f'UPDATE "SourcePage" SET {", ".join(set_clauses)} WHERE id = %s RETURNING *',
                values,
            )
            conn.commit()
            row = cur.fetchone()
            return dict(row) if row else None


def delete_source_page(source_id: int) -> bool:
    """Delete a SourcePage by id."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute('DELETE FROM "SourcePage" WHERE id = %s', (source_id,))
            conn.commit()
            return cur.rowcount > 0


def update_source_last_scraped(source_id: int):
    """Update lastScraped timestamp for a source."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                'UPDATE "SourcePage" SET "lastScraped" = NOW(), "updatedAt" = NOW() WHERE id = %s',
                (source_id,),
            )
            conn.commit()


# ──────────────────────────────────────────────
# AutoPostConfig helpers (singleton, id=1)
# ──────────────────────────────────────────────


def get_auto_config() -> dict:
    """Get the singleton AutoPostConfig row, creating it if it doesn't exist."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute('SELECT * FROM "AutoPostConfig" WHERE id = 1')
            row = cur.fetchone()
            if row:
                return dict(row)
            # Create default row
            default_prompt = "Translate and rewrite the following text in English using a Gen Z humor style, inserting appropriate emojis, while keeping the main idea."
            cur.execute(
                """INSERT INTO "AutoPostConfig" (id, "autoScrapeOn", "autoPostOn", "postIntervalMin", "scrapeIntervalMin", "aiPromptRules", "updatedAt")
                   VALUES (1, FALSE, FALSE, 120, 30, %s, NOW())
                   RETURNING *""",
                (default_prompt,),
            )
            conn.commit()
            return dict(cur.fetchone())


def update_auto_config(data: dict) -> dict:
    """Update the singleton AutoPostConfig."""
    set_clauses = []
    values = []
    for key in (
        "autoScrapeOn",
        "autoPostOn",
        "postIntervalMin",
        "scrapeIntervalMin",
        "aiPromptRules",
    ):
        if key in data:
            set_clauses.append(f'"{key}" = %s')
            values.append(data[key])
    if not set_clauses:
        return get_auto_config()
    set_clauses.append('"updatedAt" = NOW()')

    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                f'UPDATE "AutoPostConfig" SET {", ".join(set_clauses)} WHERE id = 1 RETURNING *',
                values,
            )
            conn.commit()
            row = cur.fetchone()
            if row:
                return dict(row)
            # If no row existed, create and re-update
            return get_auto_config()


# ──────────────────────────────────────────────
# Post helpers
# ──────────────────────────────────────────────


def get_all_posts() -> list[dict]:
    """Get all posts ordered by creation date descending."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute('SELECT * FROM "Post" ORDER BY "createdAt" DESC')
            return [dict(row) for row in cur.fetchall()]


def get_posts_ready_to_publish() -> list[dict]:
    """Get posts with status SCHEDULED and scheduledAt <= now."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""SELECT * FROM "Post" 
                   WHERE status = 'SCHEDULED' 
                   AND "scheduledAt" IS NOT NULL 
                   AND "scheduledAt" <= NOW()
                   ORDER BY "scheduledAt" ASC""")
            return [dict(row) for row in cur.fetchall()]


def get_post_by_id(post_id: int) -> Optional[dict]:
    """Get a single post by ID."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute('SELECT * FROM "Post" WHERE id = %s', (post_id,))
            row = cur.fetchone()
            return dict(row) if row else None


def update_post_schedule(
    post_id: int,
    rewritten_text: Optional[str],
    scheduled_at: str,
    status: str,
    fb_post_id: str,
):
    """Update post details after scheduling it to Facebook."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            if rewritten_text is not None:
                cur.execute(
                    """UPDATE "Post" 
                       SET "rewrittenText" = %s, "scheduledAt" = %s, status = %s, "fbPostId" = %s, "updatedAt" = NOW() 
                       WHERE id = %s""",
                    (rewritten_text, scheduled_at, status, fb_post_id, post_id),
                )
            else:
                cur.execute(
                    """UPDATE "Post" 
                       SET "scheduledAt" = %s, status = %s, "fbPostId" = %s, "updatedAt" = NOW() 
                       WHERE id = %s""",
                    (scheduled_at, status, fb_post_id, post_id),
                )
            conn.commit()


def update_post_status(post_id: int, status: str, fb_post_id: Optional[str] = None):
    """Update a post's status (and optionally fbPostId)."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            if fb_post_id:
                cur.execute(
                    'UPDATE "Post" SET status = %s, "fbPostId" = %s, "updatedAt" = NOW() WHERE id = %s',
                    (status, fb_post_id, post_id),
                )
            else:
                cur.execute(
                    'UPDATE "Post" SET status = %s, "updatedAt" = NOW() WHERE id = %s',
                    (status, post_id),
                )
            conn.commit()


def insert_scraped_post(
    source_post_id: str,
    original_text: str,
    rewritten_text: str,
    source_page_id: Optional[int] = None,
) -> Optional[int]:
    """Insert a new scraped+rewritten post. Returns the new post id, or None if duplicate."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            # Check duplicate
            cur.execute(
                'SELECT id FROM "Post" WHERE "sourcePostId" = %s', (source_post_id,)
            )
            if cur.fetchone():
                return None  # Already exists

            cur.execute(
                """INSERT INTO "Post" ("sourcePostId", "originalText", "rewrittenText", "status", "sourcePageId", "createdAt", "updatedAt")
                   VALUES (%s, %s, %s, 'REWRITTEN', %s, NOW(), NOW())
                   RETURNING id""",
                (source_post_id, original_text, rewritten_text, source_page_id),
            )
            conn.commit()
            row = cur.fetchone()
            return row[0] if row else None


def create_custom_post(original_text: str, rewritten_text: str) -> dict:
    """Create a new custom post from the UI."""
    import random
    import time

    source_post_id = f"custom_gen_{int(time.time() * 1000)}_{random.randint(0, 999)}"
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """INSERT INTO "Post" ("sourcePostId", "originalText", "rewrittenText", "status", "createdAt", "updatedAt")
                   VALUES (%s, %s, %s, 'REWRITTEN', NOW(), NOW())
                   RETURNING *""",
                (source_post_id, original_text, rewritten_text),
            )
            conn.commit()
            return dict(cur.fetchone())


def update_post_rewritten_text(post_id: int, rewritten_text: str) -> dict:
    """Update a post's rewritten text."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """UPDATE "Post" SET "rewrittenText" = %s, "updatedAt" = NOW()
                   WHERE id = %s RETURNING *""",
                (rewritten_text, post_id),
            )
            conn.commit()
            return dict(cur.fetchone())


def delete_post(post_id: int) -> bool:
    """Delete a post by id. Returns True if a row was deleted."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute('DELETE FROM "Post" WHERE id = %s', (post_id,))
            conn.commit()
            return cur.rowcount > 0


def get_next_auto_schedule_time() -> str:
    """Calculate the next available auto-schedule slot based on existing scheduled posts and config interval."""
    config = get_auto_config()
    interval_min = config.get("postIntervalMin", 120)

    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get the latest scheduled/posted time
            cur.execute(
                """SELECT MAX("scheduledAt") as last_time FROM "Post" 
                   WHERE status IN ('SCHEDULED', 'POSTED') AND "scheduledAt" IS NOT NULL"""
            )
            row = cur.fetchone()
            last_time = row["last_time"] if row and row["last_time"] else None

            if last_time:
                from datetime import timedelta

                next_time = last_time + timedelta(minutes=interval_min)
                # Make sure it's in the future
                from datetime import datetime, timezone

                now = datetime.now(timezone.utc)
                if next_time < now:
                    next_time = now + timedelta(minutes=10)
                return next_time.isoformat()
            else:
                from datetime import datetime, timedelta, timezone

                return (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
