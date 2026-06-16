from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.db import (bulk_delete_by_status, create_custom_post, delete_post,
                         get_paginated_posts, get_post_by_id, update_post_details,
                         update_post_status)

router = APIRouter(prefix="/api/v1/posts", tags=["Posts"])


class CreatePostRequest(BaseModel):
    originalText: str
    rewrittenText: Optional[str] = None


class UpdatePostRequest(BaseModel):
    rewrittenText: Optional[str] = None
    originalText: Optional[str] = None
    imageUrl: Optional[str] = None


class UpdatePostStatusRequest(BaseModel):
    status: str


class BulkDeleteRequest(BaseModel):
    statuses: str

@router.get("")
def list_posts(status: str = "", page: int = 1, limit: int = 50, search: str = ""):
    """Get paginated posts."""
    try:
        offset = (page - 1) * limit
        statuses = tuple(status.split(",")) if status else tuple()
        result = get_paginated_posts(statuses, limit, offset, search)
        return {"success": True, "posts": result["posts"], "total": result["total"]}
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


@router.put("/{post_id}")
def update_post(post_id: int, req: UpdatePostRequest):
    """Update a post's text or image."""
    try:
        updates = req.dict(exclude_unset=True)
        post = update_post_details(post_id, updates)
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


@router.delete("/bulk/status")
def remove_bulk_posts(statuses: str):
    """Bulk delete posts by status."""
    try:
        status_tuple = tuple(statuses.split(",")) if statuses else tuple()
        deleted_count = bulk_delete_by_status(status_tuple)
        return {"success": True, "deletedCount": deleted_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
