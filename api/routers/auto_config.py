"""
Router for managing AutoPostConfig and scheduler status.
"""

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.auto_scheduler import get_scheduler_status
from services.db import get_auto_config, update_auto_config

router = APIRouter(prefix="/api/auto-config", tags=["AutoConfig"])


class UpdateConfigRequest(BaseModel):
    autoScrapeOn: Optional[bool] = None
    autoPostOn: Optional[bool] = None
    postIntervalMin: Optional[int] = None
    scrapeIntervalMin: Optional[int] = None
    aiPromptRules: Optional[str] = None


@router.get("")
def get_config():
    """Get the current auto-post configuration and scheduler status."""
    try:
        config = get_auto_config()
        status = get_scheduler_status()
        return {"success": True, "config": config, "scheduler": status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("")
def set_config(req: UpdateConfigRequest):
    """Update auto-post configuration."""
    try:
        data = req.model_dump(exclude_none=True)
        config = update_auto_config(data)
        status = get_scheduler_status()
        return {"success": True, "config": config, "scheduler": status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
