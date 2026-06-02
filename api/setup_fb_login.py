from playwright.sync_api import sync_playwright
import time
import os

def setup_facebook_session():
    print("="*60)
    print("BƯỚC 1: KHỞI TẠO PHIÊN ĐĂNG NHẬP FACEBOOK (CHỈ CẦN LÀM 1 LẦN)")
    print("Trình duyệt sẽ mở ra. Hãy đăng nhập vào Facebook bằng tay.")
    print("Sau khi đăng nhập xong và thấy bảng tin (News Feed), hãy đóng trình duyệt lại.")
    print("Cookie sẽ được tự động lưu vào thư mục 'fb_session' để cào dữ liệu sau này.")
    print("="*60)
    
    # Ensure directory exists
    os.makedirs("./fb_session", exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(
            user_data_dir="./fb_session",
            headless=False, # Hiện trình duyệt để login tay
            viewport={"width": 1280, "height": 720}
        )
        
        page = browser.new_page()
        page.goto("https://www.facebook.com/")
        
        print("Đang chờ bạn thao tác... Đóng trình duyệt khi đã login thành công.")
        
        # Wait indefinitely until the user closes the browser
        try:
            page.wait_for_event("close", timeout=0)
        except Exception:
            pass
            
        print("Đã đóng trình duyệt. Phiên đăng nhập (Cookie) đã được lưu!")

if __name__ == "__main__":
    setup_facebook_session()
