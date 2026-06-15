import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.scraper_job import scrape_and_process_url

router = APIRouter()


class ScrapeRequest(BaseModel):
    url: str


ALLOWED_URL_PATTERN = re.compile(r"^https?://(www\.|m\.)?facebook\.com/")


@router.post("/api/trigger-scraper")
def trigger_scraper(req: ScrapeRequest):
    if not ALLOWED_URL_PATTERN.match(req.url):
        raise HTTPException(
            status_code=400, detail="Only Facebook URLs are allowed for scraping."
        )
    result = scrape_and_process_url(req.url)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result
