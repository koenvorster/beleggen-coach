"""Plans router — aanmaken en ophalen van beleggingsplannen."""
import uuid

import structlog
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import get_current_user, verify_ownership
from ..database import get_db
from ..schemas import PlanCreate, PlanResponse
from ..services.plan_service import create_plan, get_plan, get_plans

logger = structlog.get_logger(__name__)
router = APIRouter(tags=["plans"])


@router.post("/users/{user_id}/plans", response_model=PlanResponse, status_code=201)
async def create_user_plan(
    user_id: str,
    data: PlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
) -> PlanResponse:
    """Maak een nieuw beleggingsplan aan voor een gebruiker.

    Args:
        user_id: UUID van de gebruiker.
        data: Plan-data inclusief bedrag, allocatie en motivatie.
        db: Async database sessie (DI).
        current_user: Geverifieerde user_id uit het JWT.

    Returns:
        Het aangemaakte plan.

    Raises:
        HTTPException 403: Als de ingelogde gebruiker niet de eigenaar is.
    """
    verify_ownership(current_user, user_id)
    plan = await create_plan(db, user_id, data)
    logger.info("plan_aangemaakt", user_id=str(user_id), plan_id=str(plan.id), monthly_amount=float(data.monthly_amount))
    return plan


@router.get("/users/{user_id}/plans", response_model=list[PlanResponse])
async def list_user_plans(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
) -> list[PlanResponse]:
    """Haal alle plannen op voor een gebruiker.

    Args:
        user_id: UUID van de gebruiker.
        db: Async database sessie (DI).
        current_user: Geverifieerde user_id uit het JWT.

    Returns:
        Lijst van plannen, nieuwste eerst.

    Raises:
        HTTPException 403: Als de ingelogde gebruiker niet de eigenaar is.
    """
    verify_ownership(current_user, user_id)
    return await get_plans(db, user_id)


@router.get("/users/{user_id}/plans/{plan_id}", response_model=PlanResponse)
async def get_user_plan(
    user_id: str,
    plan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
) -> PlanResponse:
    """Haal één specifiek plan op voor een gebruiker.

    Args:
        user_id: UUID van de gebruiker.
        plan_id: UUID van het plan.
        db: Async database sessie (DI).
        current_user: Geverifieerde user_id uit het JWT.

    Returns:
        Het gevonden plan.

    Raises:
        HTTPException 403: Als de ingelogde gebruiker niet de eigenaar is.
        HTTPException 404: Als het plan niet gevonden is.
    """
    verify_ownership(current_user, user_id)
    plan = await get_plan(db, user_id, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan niet gevonden.")
    return plan
