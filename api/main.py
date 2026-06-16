import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import (
    auto_config,
    auto_queue,
    facebook,
    generator,
    posts,
    scraper,
    sources,
)
from services.auto_scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start background scheduler on startup, stop on shutdown."""
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(title="AI Reposting API", lifespan=lifespan)

# CORS — configurable origins via env var, default to Next.js dev server
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(facebook.router)
app.include_router(posts.router)
app.include_router(scraper.router)
app.include_router(sources.router)
app.include_router(auto_config.router)
app.include_router(auto_queue.router)
app.include_router(generator.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
