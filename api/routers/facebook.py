from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from services.facebook_service import schedule_post_for_later
from services.db import get_post_by_id, update_post_schedule
import logging

router = APIRouter(prefix="/api/v1/facebook", tags=["Facebook"])
logger = logging.getLogger("facebook_router")

class ScheduleRequest(BaseModel):
    postId: int
    scheduledTime: str
    rewrittenText: Optional[str] = None

@router.post("/schedule")
def schedule_facebook_post(req: ScheduleRequest):
    try:
        # 1. Validate post exists
        post = get_post_by_id(req.postId)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # 2. Determine text to post
        text_to_post = req.rewrittenText if req.rewrittenText else post.get("rewrittenText")
        if not text_to_post:
            text_to_post = post.get("originalText", "")
            
        if not text_to_post:
            raise HTTPException(status_code=400, detail="Cannot schedule an empty post")

        # 3. Convert ISO string to Unix timestamp (seconds)
        dt = datetime.fromisoformat(req.scheduledTime.replace("Z", "+00:00"))
        timestamp = int(dt.timestamp())
        
        # 4. Ensure timestamp is in the future
        now_ts = int(datetime.now(timezone.utc).timestamp())
        if timestamp <= now_ts:
            raise HTTPException(status_code=400, detail="Scheduled time must be in the future")

        # 5. Call Facebook Graph API via shared service
        logger.info(f"Scheduling post #{req.postId} to Facebook at timestamp {timestamp}")
        fb_result = schedule_post_for_later(text_to_post, timestamp)
        
        fb_post_id = fb_result.get("id")
        if not fb_post_id:
            raise HTTPException(status_code=500, detail="Failed to get Facebook Post ID from Graph API")

        # 6. Update database with new status and fbPostId
        update_post_schedule(
            post_id=req.postId,
            rewritten_text=req.rewrittenText,
            scheduled_at=req.scheduledTime,
            status="SCHEDULED",
            fb_post_id=fb_post_id
        )

        return {"success": True, "fbPostId": fb_post_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error scheduling post: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
