"""
Router for managing SourcePage CRUD operations.
These endpoints are called from the Next.js frontend.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.db import (
    get_all_source_pages,
    create_source_page,
    update_source_page,
    delete_source_page,
)

router = APIRouter(prefix="/api/sources", tags=["Sources"])


class CreateSourceRequest(BaseModel):
    url: str
    name: str
    interval: int = 30


class UpdateSourceRequest(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    interval: Optional[int] = None
    isActive: Optional[bool] = None


@router.get("")
def list_sources():
    """List all source pages."""
    try:
        sources = get_all_source_pages()
        return {"success": True, "sources": sources}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
def add_source(req: CreateSourceRequest):
    """Add a new source page."""
    try:
        source = create_source_page(url=req.url, name=req.name, interval=req.interval)
        return {"success": True, "source": source}
    except Exception as e:
        if "unique" in str(e).lower() or "duplicate" in str(e).lower():
            raise HTTPException(status_code=409, detail="This URL already exists!")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{source_id}")
def edit_source(source_id: int, req: UpdateSourceRequest):
    """Update a source page."""
    try:
        data = req.model_dump(exclude_none=True)
        source = update_source_page(source_id, data)
        if source is None:
            raise HTTPException(status_code=404, detail="Source page not found")
        return {"success": True, "source": source}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{source_id}")
def remove_source(source_id: int):
    """Delete a source page."""
    try:
        deleted = delete_source_page(source_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Source page not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
