"""
Router for auto-queue: quickly schedule a post to the next available slot.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel

from services.db import get_connection, get_next_auto_schedule_time

router = APIRouter(prefix="/api/auto-queue", tags=["AutoQueue"])


class AutoQueueRequest(BaseModel):
    postId: int
    rewrittenText: Optional[str] = None
    imageUrl: Optional[str] = None


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
                # Prepare updates
                updates = [
                    ('status = %s', "SCHEDULED"),
                    ('"scheduledAt" = %s', next_time),
                    ('"updatedAt" = NOW()', None)
                ]
                params = ["SCHEDULED", next_time]
                
                if req.rewrittenText:
                    updates.append(('"rewrittenText" = %s', req.rewrittenText))
                    params.append(req.rewrittenText)
                    
                if req.imageUrl:
                    updates.append(('"imageUrl" = %s', req.imageUrl))
                    params.append(req.imageUrl)
                    
                params.append(req.postId)
                
                set_clause = ", ".join([u[0] for u in updates])
                query = f'UPDATE "Post" SET {set_clause} WHERE id = %s RETURNING *'
                
                cur.execute(query, tuple(p for p in params if p is not None))
                post = cur.fetchone()
                conn.commit()

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
