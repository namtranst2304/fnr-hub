import os
import re
import json
import psycopg2
from facebook_scraper import get_posts
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

def extract_post_id(url: str) -> str:
    """Try to extract a post ID from a Facebook URL."""
    # This is a naive extraction for common URL patterns
    # e.g., facebook.com/page/posts/123456789 or facebook.com/123456789
    match = re.search(r'(?:posts/|fbid=)([a-zA-Z0-9]+)', url)
    if match:
        return match.group(1)
    
    match = re.search(r'/([0-9]{8,})/?', url)
    if match:
        return match.group(1)
    return ""

def rewrite_text_with_ai(original_text: str) -> str:
    """Uses Google Gemini to rewrite the text."""
    if not original_text or len(original_text) < 10:
        return "Nội dung quá ngắn để xào nấu."
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"""
        Dịch và viết lại đoạn văn bản sau bằng tiếng Việt theo phong cách Gen Z mặn mòi, chèn emoji hợp lý, giữ nguyên ý chính.
        Văn bản gốc:
        {original_text}
        """
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Lỗi AI: {e}")
        return "Lỗi khi xào bài bằng AI: " + str(e)

def scrape_and_process_url(fb_url: str) -> dict:
    """Scrapes a given Facebook post URL, rewrites it, and saves to DB."""
    try:
        # Determine if it's a page or post. We'll try to extract the post ID.
        post_id_to_fetch = extract_post_id(fb_url)
        
        post_data = None
        
        # Try fetching by post ID directly if found
        if post_id_to_fetch:
            print(f"Trying to fetch post ID: {post_id_to_fetch}")
            # get_posts can take post_urls
            for post in get_posts(post_urls=[fb_url], options={"comments": False}):
                post_data = post
                break
        
        # Fallback to fetching page (if URL is a page URL) and grabbing the first post
        if not post_data:
            # Extract page name (e.g. facebook.com/pagename)
            page_match = re.search(r'facebook\.com/([^/]+)', fb_url)
            if page_match:
                page_name = page_match.group(1)
                if page_name not in ['groups', 'watch', 'events', 'marketplace']:
                    print(f"Trying to fetch latest post from page: {page_name}")
                    for post in get_posts(page_name, pages=1, options={"comments": False}):
                        post_data = post
                        break
                        
        if not post_data:
            return {"success": False, "error": "Không thể cào dữ liệu từ URL này. Có thể bài viết bị riêng tư hoặc thư viện bị block."}
            
        original_text = post_data.get('text', '')
        source_id = post_data.get('post_id', post_id_to_fetch or str(hash(fb_url)))
        
        if not original_text:
             return {"success": False, "error": "Cào thành công nhưng bài viết không có chữ (chỉ có ảnh/video)."}
             
        # Rewrite with AI
        rewritten_text = rewrite_text_with_ai(original_text)
        
        # Save to DB
        db_url = os.getenv("DATABASE_URL")
        # psycopg2 connection expects standard URL without Prisma connection limits sometimes, but it should work
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
