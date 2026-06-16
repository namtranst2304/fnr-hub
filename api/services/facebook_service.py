import logging
import os

import httpx

logger = logging.getLogger("facebook_service")
logging.basicConfig(level=logging.INFO)


def get_fb_credentials():
    page_id = os.getenv("FACEBOOK_PAGE_ID", "")
    access_token = os.getenv("FACEBOOK_ACCESS_TOKEN", "")
    if not page_id or not access_token:
        logger.warning("Facebook credentials missing. Using MOCK mode for testing.")
        return "MOCK_PAGE", "MOCK_TOKEN"
    return page_id, access_token


def _post_to_fb(payload: dict, endpoint: str = "feed") -> dict:
    page_id, _ = get_fb_credentials()

    if page_id == "MOCK_PAGE":
        logger.info(
            f"[MOCK FACEBOOK API] Endpoint: {endpoint}, Received payload: {payload}"
        )
        return {"id": f"mock_post_{os.urandom(4).hex()}"}

    url = f"https://graph.facebook.com/v19.0/{page_id}/{endpoint}"

    try:
        response = httpx.post(url, data=payload, timeout=30.0)
        result = response.json()
        if "error" in result:
            logger.error(f"Facebook Graph API Error: {result['error']}")
            raise Exception(result["error"].get("message", str(result["error"])))
        return result
    except httpx.RequestError as e:
        logger.error(f"HTTP Request error to Facebook Graph API: {e}")
        raise Exception(f"Failed to connect to Facebook Graph API: {str(e)}")


def publish_post_immediately(message: str, image_url: str = None) -> dict:
    """
    Publish a post to Facebook immediately.
    Used by Auto Scheduler when scheduledAt <= now.
    """
    _, access_token = get_fb_credentials()

    if image_url:
        payload = {
            "caption": message,
            "url": image_url,
            "published": "true",
            "access_token": access_token,
        }
        return _post_to_fb(payload, endpoint="photos")
    else:
        payload = {
            "message": message,
            "published": "true",
            "access_token": access_token,
        }
        return _post_to_fb(payload, endpoint="feed")


def schedule_post_for_later(
    message: str, scheduled_timestamp: int, image_url: str = None
) -> dict:
    """
    Tell Facebook to hold the post and publish it at the given Unix timestamp (seconds).
    Used by User Manual Scheduling via UI.
    """
    _, access_token = get_fb_credentials()

    if image_url:
        payload = {
            "caption": message,
            "url": image_url,
            "published": "false",
            "scheduled_publish_time": str(scheduled_timestamp),
            "access_token": access_token,
        }
        return _post_to_fb(payload, endpoint="photos")
    else:
        payload = {
            "message": message,
            "published": "false",
            "scheduled_publish_time": str(scheduled_timestamp),
            "access_token": access_token,
        }
        return _post_to_fb(payload, endpoint="feed")
