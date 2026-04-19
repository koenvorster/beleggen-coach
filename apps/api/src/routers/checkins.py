"""CheckIns router — maandelijkse check-ins aanmaken en ophalen."""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..schemas import CheckInCreate, CheckInResponse
from ..services.checkin_service import create_checkin, get_checkins

router = APIRouter(tags=["checkins"])


@router.post("/users/{user_id}/checkins", response_model=CheckInResponse, status_code=201)
async def create_user_checkin(
    user_id: uuid.UUID,
    data: CheckInCreate,
    db: AsyncSession = Depends(get_db),
) -> CheckInResponse:
    """Maak een maandelijkse check-in aan voor een gebruiker.

    Args:
        user_id: UUID van de gebruiker.
        data: Check-in data inclusief maand, emotie en investeringsstatus.
        db: Async database sessie (DI).

    Returns:
        De aangemaakte check-in.

    Raises:
        HTTPException: 409 als er al een check-in bestaat voor deze maand.
    """
    checkin, created = await create_checkin(db, user_id, data)
    if not created:
        raise HTTPException(
            status_code=409,
            detail=f"Je hebt al een check-in voor {data.month}.",
        )
    return checkin


@router.get("/users/{user_id}/checkins", response_model=list[CheckInResponse])
async def list_user_checkins(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[CheckInResponse]:
    """Haal alle check-ins op voor een gebruiker.

    Args:
        user_id: UUID van de gebruiker.
        db: Async database sessie (DI).

    Returns:
        Lijst van check-ins, nieuwste maand eerst.
    """
    return await get_checkins(db, user_id)
