"""Plans router — aanmaken en ophalen van beleggingsplannen."""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..schemas import PlanCreate, PlanResponse
from ..services.plan_service import create_plan, get_plan, get_plans

router = APIRouter(tags=["plans"])


@router.post("/users/{user_id}/plans", response_model=PlanResponse, status_code=201)
async def create_user_plan(
    user_id: uuid.UUID,
    data: PlanCreate,
    db: AsyncSession = Depends(get_db),
) -> PlanResponse:
    """Maak een nieuw beleggingsplan aan voor een gebruiker.

    Args:
        user_id: UUID van de gebruiker.
        data: Plan-data inclusief bedrag, allocatie en motivatie.
        db: Async database sessie (DI).

    Returns:
        Het aangemaakte plan.
    """
    plan = await create_plan(db, user_id, data)
    return plan


@router.get("/users/{user_id}/plans", response_model=list[PlanResponse])
async def list_user_plans(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[PlanResponse]:
    """Haal alle plannen op voor een gebruiker.

    Args:
        user_id: UUID van de gebruiker.
        db: Async database sessie (DI).

    Returns:
        Lijst van plannen, nieuwste eerst.
    """
    return await get_plans(db, user_id)


@router.get("/users/{user_id}/plans/{plan_id}", response_model=PlanResponse)
async def get_user_plan(
    user_id: uuid.UUID,
    plan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> PlanResponse:
    """Haal één specifiek plan op voor een gebruiker.

    Args:
        user_id: UUID van de gebruiker.
        plan_id: UUID van het plan.
        db: Async database sessie (DI).

    Returns:
        Het gevonden plan.

    Raises:
        HTTPException: 404 als het plan niet gevonden is.
    """
    plan = await get_plan(db, user_id, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan niet gevonden.")
    return plan
