from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.generator_service import generate_custom_post

router = APIRouter()


class GenerateRequest(BaseModel):
    prompt: str
    image_base64: Optional[str] = None


@router.post("/api/generate")
def trigger_generation(req: GenerateRequest):
    result = generate_custom_post(req.prompt, req.image_base64)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result
