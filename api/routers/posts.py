from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.db import get_all_posts, create_custom_post, update_post_rewritten_text

router = APIRouter(prefix="/api/v1/posts", tags=["Posts"])

class CreatePostRequest(BaseModel):
    originalText: str
    rewrittenText: Optional[str] = None

class UpdatePostRequest(BaseModel):
    rewrittenText: str

@router.get("/")
def list_posts():
    """Get all posts."""
    try:
        posts = get_all_posts()
        return {"success": True, "posts": posts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def create_post(req: CreatePostRequest):
    """Create a new custom post."""
    try:
        post = create_custom_post(req.originalText, req.rewrittenText or "")
        return {"success": True, "post": post}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{post_id}")
def update_post(post_id: int, req: UpdatePostRequest):
    """Update a post's rewritten text."""
    try:
        post = update_post_rewritten_text(post_id, req.rewrittenText)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        return {"success": True, "post": post}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
