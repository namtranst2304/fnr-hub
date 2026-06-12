"""
Router for auto-queue: quickly schedule a post to the next available slot.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.db import get_next_auto_schedule_time, get_connection
from psycopg2.extras import RealDictCursor
from datetime import datetime

router = APIRouter(prefix="/api/auto-queue", tags=["AutoQueue"])


class AutoQueueRequest(BaseModel):
    postId: int
    rewrittenText: Optional[str] = None


@router.post("")
def auto_queue_post(req: AutoQueueRequest):
    """
    Automatically schedule a post to the next available time slot.
    The slot is calculated based on the last scheduled post + postIntervalMin.
    """
    try:
        next_time_iso = get_next_auto_schedule_time()
        next_time = datetime.fromisoformat(next_time_iso)

        with get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Update rewrittenText if provided
                updates = {
                    "status": "SCHEDULED",
                    "scheduledAt": next_time,
                }

                if req.rewrittenText:
                    cur.execute(
                        '''UPDATE "Post" SET "rewrittenText" = %s, status = %s, "scheduledAt" = %s, "updatedAt" = NOW()
                           WHERE id = %s RETURNING *''',
                        (req.rewrittenText, "SCHEDULED", next_time, req.postId)
                    )
                else:
                    cur.execute(
                        '''UPDATE "Post" SET status = %s, "scheduledAt" = %s, "updatedAt" = NOW()
                           WHERE id = %s RETURNING *''',
                        ("SCHEDULED", next_time, req.postId)
                    )
                conn.commit()
                post = cur.fetchone()

                if not post:
                    raise HTTPException(status_code=404, detail="Post not found")

                return {
                    "success": True,
                    "scheduledAt": next_time_iso,
                    "post": dict(post),
                }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
