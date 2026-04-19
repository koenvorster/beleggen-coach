"""Redis cache client voor de beleggingsapp API."""
import json
import logging
from typing import Any

import redis.asyncio as aioredis

from .config import settings

logger = logging.getLogger(__name__)

_redis_client: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    """Geef de Redis client terug (lazy init)."""
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _redis_client


async def cache_get(key: str) -> Any | None:
    """Haal een waarde op uit de cache. Geeft None als niet gevonden."""
    try:
        client = await get_redis()
        raw = await client.get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except Exception as e:
        logger.warning("Redis cache get fout voor key=%s: %s", key, e)
        return None


async def cache_set(key: str, value: Any, ttl_seconds: int = 3600) -> None:
    """Sla een waarde op in de cache met TTL."""
    try:
        client = await get_redis()
        await client.setex(key, ttl_seconds, json.dumps(value))
    except Exception as e:
        logger.warning("Redis cache set fout voor key=%s: %s", key, e)


async def cache_delete(key: str) -> None:
    """Verwijder een cache-entry."""
    try:
        client = await get_redis()
        await client.delete(key)
    except Exception as e:
        logger.warning("Redis cache delete fout voor key=%s: %s", key, e)


async def ping_redis() -> bool:
    """Controleer of Redis bereikbaar is. Geeft False bij fout (geen crash)."""
    try:
        client = await get_redis()
        await client.ping()
        return True
    except Exception:
        return False
