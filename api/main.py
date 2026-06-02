from fastapi import FastAPI
from routers import chat

app = FastAPI(title="AI Reposting API")

# Include Routers
app.include_router(chat.router)

@app.get("/api/health")
async def health():
    return {"status": "ok"}
