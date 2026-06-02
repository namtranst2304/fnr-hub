from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.scraper_job import scrape_and_process_url

router = APIRouter()

class ScrapeRequest(BaseModel):
    url: str

@router.post("/api/trigger-scraper")
def trigger_scraper(req: ScrapeRequest):
    result = scrape_and_process_url(req.url)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result
