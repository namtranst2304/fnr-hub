from fastapi import FastAPI
from routers import chat, facebook, scraper

app = FastAPI(title="AI Reposting API")

# Include Routers
app.include_router(chat.router)
app.include_router(facebook.router)
app.include_router(scraper.router)

@app.get("/api/health")
async def health():
    return {"status": "ok"}
