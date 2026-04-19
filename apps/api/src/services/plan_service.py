"""Plan service — business logic voor beleggingsplannen."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..domain.events import PlanAangemaakt, event_bus
from ..models import Plan
from ..schemas import PlanCreate


async def create_plan(db: AsyncSession, user_id: str, data: PlanCreate) -> Plan:
    """Maak een nieuw beleggingsplan aan voor een gebruiker.

    Args:
        db: Async database sessie.
        user_id: UUID van de gebruiker.
        data: Validated PlanCreate schema.

    Returns:
        Het aangemaakte Plan object.
    """
    allocation_dicts = [item.model_dump() for item in data.allocation]
    plan = Plan(
        id=uuid.uuid4(),
        user_id=user_id,
        monthly_amount=data.monthly_amount,
        allocation=allocation_dicts,
        rationale=data.rationale,
        risk_notes=data.risk_notes,
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    await event_bus.publish(PlanAangemaakt(
        aggregate_id=plan.id,
        user_id=user_id,
        maandbedrag_eur=float(plan.monthly_amount),
        etf_isins=[item["isin"] for item in plan.allocation if "isin" in item],
    ))
    return plan


async def get_plans(db: AsyncSession, user_id: str) -> list[Plan]:
    """Haal alle plannen op voor een gebruiker.

    Args:
        db: Async database sessie.
        user_id: UUID van de gebruiker.

    Returns:
        Lijst van Plan objecten, gesorteerd op aanmaakdatum (nieuwste eerst).
    """
    result = await db.execute(
        select(Plan)
        .where(Plan.user_id == user_id)
        .order_by(Plan.created_at.desc())
    )
    return list(result.scalars().all())


async def get_plan(db: AsyncSession, user_id: str, plan_id: uuid.UUID) -> Plan | None:
    """Haal één plan op voor een gebruiker.

    Args:
        db: Async database sessie.
        user_id: UUID van de gebruiker.
        plan_id: UUID van het plan.

    Returns:
        Het Plan object of None als niet gevonden.
    """
    return await db.scalar(
        select(Plan).where(Plan.id == plan_id, Plan.user_id == user_id)
    )
