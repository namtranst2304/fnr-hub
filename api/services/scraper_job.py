import os
import random
import re
import time

import google.generativeai as genai
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

from services.db import get_auto_config

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))


def rewrite_text_with_ai(original_text: str) -> str:
    """Uses Google Gemini to rewrite the text."""
    if not original_text or len(original_text) < 10:
        return "Content is too short to be rewritten."

    models_to_try = [
        "gemini-3.5-flash",
        "gemini-3.0-flash",
        "gemini-2.5-flash",
        "gemini-1.5-pro",
    ]
    max_retries_per_model = 2

    config = get_auto_config()
    system_instruction = config.get("aiPromptRules", "")

    last_error = None

    for model_name in models_to_try:
        if system_instruction:
            model = genai.GenerativeModel(
                model_name, system_instruction=system_instruction
            )
        else:
            model = genai.GenerativeModel(model_name)

        for attempt in range(max_retries_per_model):
            try:
                response = model.generate_content(f"Original text:\n{original_text}")
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                last_error = e
                print(f"AI Error ({model_name} - Attempt {attempt + 1}): {e}")
                time.sleep(2**attempt)  # Retry sau 1s, 2s...

    return f"Failed to rewrite post after multiple attempts: {last_error}"


def extract_post_id(url: str) -> str:
    """Extract a unique post ID from URL for deduplication."""
    match = re.search(r"(?:posts/|fbid=)([a-zA-Z0-9]+)", url)
    if match:
        return match.group(1)
    match = re.search(r"/([0-9]{8,})/?", url)
    if match:
        return match.group(1)
    return str(hash(url))


def scrape_with_playwright(url: str) -> str:
    """Uses Playwright in stealth mode with user_data_dir to scrape FB post text."""
    session_dir = os.path.abspath("./fb_session")

    with sync_playwright() as p:
        # headless=True for automated background run
        context = p.chromium.launch_persistent_context(
            user_data_dir=session_dir,
            headless=True,
            args=["--disable-blink-features=AutomationControlled"],
        )

        page = context.new_page()

        # Add a random delay to act human
        time.sleep(random.uniform(1, 3))

        print(f"Playwright navigated to: {url}")
        page.goto(url, wait_until="domcontentloaded")

        # Wait for either the specific message div OR the main content area
        # Facebook's DOM is highly obfuscated. We try multiple selectors.
        content = ""
        try:
            # Tactic 1: The user's suggested div
            page.wait_for_selector('div[data-ad-preview="message"]', timeout=10000)
            content = page.inner_text('div[data-ad-preview="message"]')
        except Exception:
            print("Cannot find data-ad-preview, trying another selector...")
            try:
                # Tactic 2: Generic post text area (often has dir="auto" inside a usercontent div)
                # We wait for the page to settle
                time.sleep(3)
                elements = page.query_selector_all(
                    'div[data-ad-comet-preview="message"], div[dir="auto"]'
                )

                # Filter out small UI elements, get the longest text block which is likely the post
                texts = [
                    el.inner_text() for el in elements if el and el.inner_text().strip()
                ]
                if texts:
                    content = max(texts, key=len)
            except Exception as e2:
                print("Error scraping card:", e2)

        context.close()
        return content.strip()


def scrape_and_process_url(fb_url: str) -> dict:
    """Scrapes a given Facebook post URL using Playwright, rewrites it, and saves to DB."""
    try:
        source_id = extract_post_id(fb_url)

        print("Started scraping data with Playwright...")
        original_text = scrape_with_playwright(fb_url)

        if not original_text:
            return {
                "success": False,
                "error": "Playwright could not find post content. Maybe due to missing Login or Facebook UI change.",
            }

        # Rewrite with AI
        print("Scrape successful, rewriting via AI...")
        rewritten_text = rewrite_text_with_ai(original_text)

        # Save to DB using centralized helper
        from services.db import insert_scraped_post

        new_id = insert_scraped_post(
            source_post_id=source_id,
            original_text=original_text,
            rewritten_text=rewritten_text,
        )

        if new_id is None:
            return {"success": False, "error": "This post has already been scraped!"}

        return {
            "success": True,
            "message": "Scrape & Rewrite successful!",
            "post_id": new_id,
            "source_id": source_id,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}
