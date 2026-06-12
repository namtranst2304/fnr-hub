import os
import re
import psycopg2
import google.generativeai as genai
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync
import time
import random

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

def rewrite_text_with_ai(original_text: str) -> str:
    """Uses Google Gemini to rewrite the text."""
    if not original_text or len(original_text) < 10:
        return "Nội dung quá ngắn để xào nấu."
    
    models_to_try = ["gemini-3.5-flash", "gemini-3.0-flash", "gemini-2.5-flash", "gemini-1.5-pro"]
    max_retries_per_model = 2
    
    prompt = f"""
    Dịch và viết lại đoạn văn bản sau bằng tiếng Việt theo phong cách Gen Z mặn mòi, chèn emoji hợp lý, giữ nguyên ý chính.
    Văn bản gốc:
    {original_text}
    """
    
    last_error = None
    
    for model_name in models_to_try:
        model = genai.GenerativeModel(model_name)
        for attempt in range(max_retries_per_model):
            try:
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                last_error = e
                print(f"Lỗi AI ({model_name} - Lần {attempt + 1}): {e}")
                time.sleep(2 ** attempt) # Retry sau 1s, 2s...
                
    return f"Lỗi khi xào bài bằng AI sau nhiều lần thử: {last_error}"

def extract_post_id(url: str) -> str:
    """Extract a unique post ID from URL for deduplication."""
    match = re.search(r'(?:posts/|fbid=)([a-zA-Z0-9]+)', url)
    if match: return match.group(1)
    match = re.search(r'/([0-9]{8,})/?', url)
    if match: return match.group(1)
    return str(hash(url))

def scrape_with_playwright(url: str) -> str:
    """Uses Playwright in stealth mode with user_data_dir to scrape FB post text."""
    session_dir = os.path.abspath("./fb_session")
    
    with sync_playwright() as p:
        # headless=True for automated background run
        browser = p.chromium.launch_persistent_context(
            user_data_dir=session_dir,
            headless=True,
            args=["--disable-blink-features=AutomationControlled"]
        )
        
        page = browser.new_page()
        stealth_sync(page)
        
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
            print("Không tìm thấy data-ad-preview, thử selector khác...")
            try:
                # Tactic 2: Generic post text area (often has dir="auto" inside a usercontent div)
                # We wait for the page to settle
                time.sleep(3)
                elements = page.query_selector_all('div[data-ad-comet-preview="message"], div[dir="auto"]')
                
                # Filter out small UI elements, get the longest text block which is likely the post
                texts = [el.inner_text() for el in elements if el and el.inner_text().strip()]
                if texts:
                    content = max(texts, key=len)
            except Exception as e2:
                print("Lỗi cào thẻ:", e2)

        browser.close()
        return content.strip()

def scrape_and_process_url(fb_url: str) -> dict:
    """Scrapes a given Facebook post URL using Playwright, rewrites it, and saves to DB."""
    try:
        source_id = extract_post_id(fb_url)
        
        print("Bắt đầu cào dữ liệu bằng Playwright...")
        original_text = scrape_with_playwright(fb_url)
        
        if not original_text:
             return {"success": False, "error": "Playwright không tìm thấy nội dung bài viết. Có thể do chưa Login hoặc Facebook thay đổi giao diện."}
             
        # Rewrite with AI
        print("Cào thành công, đang xào bài bằng AI...")
        rewritten_text = rewrite_text_with_ai(original_text)
        
        # Save to DB
        db_url = os.getenv("DATABASE_URL")
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Check if exists
        cur.execute('SELECT id FROM "Post" WHERE "sourcePostId" = %s', (source_id,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return {"success": False, "error": "Bài viết này đã được cào trước đó rồi!"}
            
        # Insert
        insert_query = """
        INSERT INTO "Post" ("sourcePostId", "originalText", "rewrittenText", "status", "createdAt", "updatedAt")
        VALUES (%s, %s, %s, 'REWRITTEN', NOW(), NOW())
        RETURNING id;
        """
        cur.execute(insert_query, (source_id, original_text, rewritten_text))
        new_id = cur.fetchone()[0]
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            "success": True, 
            "message": "Cào & Xào thành công!", 
            "post_id": new_id,
            "source_id": source_id
        }

    except Exception as e:
        return {"success": False, "error": str(e)}
