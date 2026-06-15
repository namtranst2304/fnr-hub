from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.db import (create_custom_post, delete_post, get_all_posts,
                         get_post_by_id, update_post_rewritten_text,
                         update_post_status)

router = APIRouter(prefix="/api/v1/posts", tags=["Posts"])


class CreatePostRequest(BaseModel):
    originalText: str
    rewrittenText: Optional[str] = None


class UpdatePostRequest(BaseModel):
    rewrittenText: str


class UpdatePostStatusRequest(BaseModel):
    status: str


@router.get("")
def list_posts():
    """Get all posts."""
    try:
        posts = get_all_posts()
        return {"success": True, "posts": posts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
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


@router.put("/{post_id}/status")
def update_status(post_id: int, req: UpdatePostStatusRequest):
    """Update a post's status."""
    try:
        update_post_status(post_id, req.status)
        post = get_post_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        return {"success": True, "post": post}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{post_id}")
def remove_post(post_id: int):
    """Delete a post by ID."""
    try:
        deleted = delete_post(post_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Post not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
