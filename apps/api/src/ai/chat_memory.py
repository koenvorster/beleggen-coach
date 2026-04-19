"""Redis-backed chat memory voor AI coach sessies."""
import logging
from datetime import datetime, timezone
from typing import Any

from ..cache import cache_get, cache_set, cache_delete

logger = logging.getLogger(__name__)

CHAT_TTL_SECONDS = 86400  # 24 uur
MAX_MESSAGES = 20  # sliding window


def _chat_key(user_id: str) -> str:
    return f"chat:{user_id}"


async def get_chat_history(user_id: str) -> list[dict[str, Any]]:
    """Haal chat history op voor een gebruiker.

    Args:
        user_id: Unieke gebruikers-ID (kan clerk/keycloak sub zijn of session ID).

    Returns:
        Lijst van berichten: [{"role": "user"|"assistant", "content": str, "timestamp": str}]
    """
    key = _chat_key(user_id)
    data = await cache_get(key)
    if data is None:
        return []
    return data if isinstance(data, list) else []


async def add_message(user_id: str, role: str, content: str) -> list[dict[str, Any]]:
    """Voeg een bericht toe aan de chat history (sliding window van MAX_MESSAGES).

    Args:
        user_id: Unieke gebruikers-ID.
        role: "user" of "assistant".
        content: Inhoud van het bericht.

    Returns:
        Bijgewerkte history.
    """
    history = await get_chat_history(user_id)
    history.append({
        "role": role,
        "content": content,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    if len(history) > MAX_MESSAGES:
        history = history[-MAX_MESSAGES:]

    key = _chat_key(user_id)
    await cache_set(key, history, ttl_seconds=CHAT_TTL_SECONDS)
    return history


async def clear_chat_history(user_id: str) -> None:
    """Verwijder de volledige chat history voor een gebruiker.

    Args:
        user_id: Unieke gebruikers-ID.
    """
    await cache_delete(_chat_key(user_id))


async def get_context_messages(user_id: str, max_context: int = 10) -> list[dict[str, str]]:
    """Geef de laatste N berichten terug als OpenAI/Ollama-formaat (zonder timestamp).

    Args:
        user_id: Unieke gebruikers-ID.
        max_context: Maximaal aantal berichten mee te geven als context.

    Returns:
        Lijst van {"role": ..., "content": ...} dicts.
    """
    history = await get_chat_history(user_id)
    recent = history[-max_context:] if len(history) > max_context else history
    return [{"role": m["role"], "content": m["content"]} for m in recent]
