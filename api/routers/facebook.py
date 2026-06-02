from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx
import os

router = APIRouter(prefix="/api/v1/facebook", tags=["Facebook"])

PAGE_ID = os.getenv("FACEBOOK_PAGE_ID", "")
PAGE_ACCESS_TOKEN = os.getenv("FACEBOOK_PAGE_ACCESS_TOKEN", "")

class SchedulePostRequest(BaseModel):
    content: str
    publish_timestamp: Optional[int] = None

@router.post("/schedule")
async def schedule_facebook_post(request: SchedulePostRequest):
    if not PAGE_ID or not PAGE_ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="Facebook credentials not configured in .env")
        
    url = f"https://graph.facebook.com/v19.0/{PAGE_ID}/feed"
    
    payload = {
        'message': request.content,
        'access_token': PAGE_ACCESS_TOKEN
    }
    
    # If a timestamp is provided, schedule it, otherwise post immediately
    if request.publish_timestamp:
        payload['published'] = 'false'
        payload['scheduled_publish_time'] = request.publish_timestamp
        
    async with httpx.AsyncClient() as client:
        response = await client.post(url, data=payload)
        result = response.json()
        
        if 'id' in result:
            return {
                "success": True, 
                "post_id": result["id"], 
                "status": "SCHEDULED" if request.publish_timestamp else "POSTED"
            }
        else:
            raise HTTPException(status_code=400, detail=str(result))
