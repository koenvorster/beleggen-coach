"""Chat memory router — ophalen en verwijderen van chat history."""
from fastapi import APIRouter

from ..ai.chat_memory import get_chat_history, clear_chat_history

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/{user_id}/history")
async def get_history(user_id: str) -> dict:
    """Haal de chat history op voor een gebruiker.

    Args:
        user_id: Unieke gebruikers-ID.
    """
    history = await get_chat_history(user_id)
    return {
        "success": True,
        "data": {"user_id": user_id, "messages": history, "count": len(history)},
        "error": None,
    }


@router.delete("/{user_id}/history", status_code=204)
async def delete_history(user_id: str) -> None:
    """Verwijder de volledige chat history voor een gebruiker.

    Args:
        user_id: Unieke gebruikers-ID.
    """
    await clear_chat_history(user_id)
