"""FastAPI applicatie-entry point."""
import time
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .logging_config import configure_logging
from .middleware import RequestLoggingMiddleware
from .routers import ai_router, etfs_router, onboarding_router
from .routers.health import router as health_router
from .routers.plans import router as plans_router
from .routers.checkins import router as checkins_router
from .routers.portfolio import router as portfolio_router
from .routers.chat_memory import router as chat_memory_router
from .routers.market_data import router as market_data_router

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Beheer de applicatie-levenscyclus: startup en shutdown."""
    configure_logging(settings.environment)
    app.state.startup_time = time.monotonic()

    from .ai import client as ai_client_module
    ai_client_module._client = ai_client_module.OllamaClient(
        base_url=settings.ollama_base_url,
        timeout=settings.ollama_timeout,
    )
    available = await ai_client_module._client.is_available()
    if available:
        logger.info("ollama_available", url=settings.ollama_base_url)
    else:
        logger.warning("ollama_unavailable", url=settings.ollama_base_url)

    yield

    logger.info("app_shutdown")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Backend API voor de AI-beleggingscoach voor beginners.",
    lifespan=lifespan,
)

# Logging en request-middleware vóór CORS (Starlette voert middleware uit in omgekeerde volgorde)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(onboarding_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")
app.include_router(etfs_router, prefix="/api/v1")
app.include_router(plans_router, prefix="/api/v1")
app.include_router(checkins_router, prefix="/api/v1")
app.include_router(portfolio_router, prefix="/api/v1")
app.include_router(chat_memory_router, prefix="/api/v1")
app.include_router(market_data_router, prefix="/api/v1")
