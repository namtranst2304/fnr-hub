from playwright.sync_api import sync_playwright
import time
import os

def setup_facebook_session():
    print("="*60)
    print("STEP 1: INITIALIZE FACEBOOK LOGIN SESSION (ONLY DO THIS ONCE)")
    print("The browser will open. Please login to Facebook manually.")
    print("After logging in and seeing the News Feed, close the browser.")
    print("The cookie will be automatically saved to the 'fb_session' folder for later scraping.")
    print("="*60)
    
    # Ensure directory exists
    os.makedirs("./fb_session", exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(
            user_data_dir="./fb_session",
            headless=False, # Show browser for manual login
            viewport={"width": 1280, "height": 720}
        )
        
        page = browser.new_page()
        page.goto("https://www.facebook.com/")
        
        print("Waiting for your action... Close the browser once logged in successfully.")
        
        # Wait indefinitely until the user closes the browser
        try:
            page.wait_for_event("close", timeout=0)
        except Exception:
            pass
            
        print("Browser closed. Login session (Cookie) has been saved!")

if __name__ == "__main__":
    setup_facebook_session()
