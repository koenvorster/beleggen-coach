"""FastAPI applicatie-entry point."""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .config import settings
from .logging_config import configure_logging
from .middleware import RequestLoggingMiddleware
from .routers import ai_router, etfs_router, onboarding_router
from .routers.plans import router as plans_router
from .routers.checkins import router as checkins_router
from .routers.portfolio import router as portfolio_router
from .routers.chat_memory import router as chat_memory_router
from .routers.market_data import router as market_data_router
from .ai.client import get_client

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Backend API voor de AI-beleggingscoach voor beginners.",
)

# Logging en request-middleware vóór CORS (Starlette voert middleware uit in omgekeerde volgorde)
configure_logging(debug=settings.debug)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(onboarding_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")
app.include_router(etfs_router, prefix="/api/v1")
app.include_router(plans_router, prefix="/api/v1")
app.include_router(checkins_router, prefix="/api/v1")
app.include_router(portfolio_router, prefix="/api/v1")
app.include_router(chat_memory_router, prefix="/api/v1")
app.include_router(market_data_router, prefix="/api/v1")


@app.on_event("startup")
async def _startup() -> None:
    """Initialiseer de Ollama client met de geconfigureerde URL."""
    from .ai import client as ai_client_module
    ai_client_module._client = ai_client_module.OllamaClient(
        base_url=settings.ollama_base_url,
        timeout=settings.ollama_timeout,
    )
    available = await ai_client_module._client.is_available()
    if available:
        logger.info("Ollama beschikbaar op %s", settings.ollama_base_url)
    else:
        logger.warning("Ollama NIET beschikbaar op %s — AI-endpoints geven 503", settings.ollama_base_url)


@app.get("/health", tags=["health"])
async def health() -> dict:
    """Uitgebreide health check: API + DB + Redis."""
    from .database import engine
    from .cache import ping_redis

    db_ok = False
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    redis_ok = await ping_redis()

    overall = "ok" if db_ok and redis_ok else "degraded"

    return {
        "status": overall,
        "version": settings.app_version,
        "services": {
            "database": "ok" if db_ok else "unavailable",
            "redis": "ok" if redis_ok else "unavailable",
        },
    }
