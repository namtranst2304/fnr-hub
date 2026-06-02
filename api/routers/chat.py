from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from models.chat import ChatRequest
from services.ollama import generate_stream, generate_sync

# Clear, versioned route prefix
router = APIRouter(prefix="/api/v1/chat", tags=["Chat & Completion"])

@router.post("/sync")
async def chat_sync(request: ChatRequest):
    """
    Standard chat endpoint (non-streaming). 
    Wait for the entire response to finish before returning.
    """
    return await generate_sync(request.messages, request.model)

@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """
    Streaming chat endpoint (for real-time UI like ChatGPT).
    Returns Server-Sent Events (SSE) stream.
    """
    return StreamingResponse(
        generate_stream(request.messages, request.model), 
        media_type="text/event-stream"
    )
