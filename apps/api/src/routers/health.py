"""Health check router — status van API, database, Redis en Ollama."""
import time

import structlog
from fastapi import APIRouter, Request
from sqlalchemy import text

logger = structlog.get_logger(__name__)
router = APIRouter(tags=["health"])


@router.get("/health")
async def health(request: Request) -> dict:
    """Uitgebreide health check: API + DB + Redis + Ollama.

    Returns:
        Dict met status, versie, omgeving, checks per service en uptime.
    """
    from ..database import engine
    from ..cache import ping_redis
    from ..ai import client as ai_client_module
    from ..config import settings

    db_status = "ok"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"error: {exc}"

    redis_ok = await ping_redis()
    redis_status = "ok" if redis_ok else "error: unreachable"

    ollama_status = "ok"
    try:
        client = ai_client_module._client
        if client is None or not await client.is_available():
            ollama_status = "error: unreachable"
    except Exception as exc:
        ollama_status = f"error: {exc}"

    startup_time: float = getattr(request.app.state, "startup_time", 0.0)
    uptime = round(time.monotonic() - startup_time, 1) if startup_time else 0.0

    overall = "ok" if (db_status == "ok" and redis_ok) else "degraded"

    logger.info(
        "health_check",
        status=overall,
        db=db_status,
        redis=redis_status,
        ollama=ollama_status,
        uptime_seconds=uptime,
    )

    return {
        "status": overall,
        "version": settings.app_version,
        "environment": settings.environment,
        "checks": {
            "database": db_status,
            "redis": redis_status,
            "ollama": ollama_status,
        },
        "uptime_seconds": uptime,
    }
