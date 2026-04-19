"""CheckIns router — maandelijkse check-ins aanmaken en ophalen."""
import uuid

import structlog
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import get_current_user, verify_ownership
from ..database import get_db
from ..schemas import CheckInCreate, CheckInResponse
from ..services.checkin_service import create_checkin, get_checkins

logger = structlog.get_logger(__name__)
router = APIRouter(tags=["checkins"])


@router.post("/users/{user_id}/checkins", response_model=CheckInResponse, status_code=201)
async def create_user_checkin(
    user_id: uuid.UUID,
    data: CheckInCreate,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
) -> CheckInResponse:
    """Maak een maandelijkse check-in aan voor een gebruiker.

    Args:
        user_id: UUID van de gebruiker.
        data: Check-in data inclusief maand, emotie en investeringsstatus.
        db: Async database sessie (DI).
        current_user: Geverifieerde user_id uit het JWT.

    Returns:
        De aangemaakte check-in.

    Raises:
        HTTPException 403: Als de ingelogde gebruiker niet de eigenaar is.
        HTTPException 409: Als er al een check-in bestaat voor deze maand.
    """
    verify_ownership(current_user, user_id)
    checkin, created = await create_checkin(db, user_id, data)
    if not created:
        raise HTTPException(
            status_code=409,
            detail=f"Je hebt al een check-in voor {data.month}.",
        )
    logger.info("checkin_opgeslagen", user_id=str(user_id), month=str(data.month), checkin_id=str(checkin.id))
    return checkin


@router.get("/users/{user_id}/checkins", response_model=list[CheckInResponse])
async def list_user_checkins(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
) -> list[CheckInResponse]:
    """Haal alle check-ins op voor een gebruiker.

    Args:
        user_id: UUID van de gebruiker.
        db: Async database sessie (DI).
        current_user: Geverifieerde user_id uit het JWT.

    Returns:
        Lijst van check-ins, nieuwste maand eerst.

    Raises:
        HTTPException 403: Als de ingelogde gebruiker niet de eigenaar is.
    """
    verify_ownership(current_user, user_id)
    return await get_checkins(db, user_id)
