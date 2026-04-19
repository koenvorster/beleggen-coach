"""CheckIn service — business logic voor maandelijkse check-ins."""
import uuid

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..domain.events import CheckInVoltooid, event_bus
from ..models import CheckIn
from ..schemas import CheckInCreate


async def create_checkin(
    db: AsyncSession, user_id: uuid.UUID, data: CheckInCreate
) -> tuple[CheckIn, bool]:
    """Maak een check-in aan voor een gebruiker en maand.

    Args:
        db: Async database sessie.
        user_id: UUID van de gebruiker.
        data: Validated CheckInCreate schema.

    Returns:
        Tuple van (CheckIn, created). created=False als er al een bestaat voor die maand.
    """
    existing = await db.scalar(
        select(CheckIn).where(
            CheckIn.user_id == user_id,
            CheckIn.month == data.month,
        )
    )
    if existing:
        return existing, False

    checkin = CheckIn(
        id=uuid.uuid4(),
        user_id=user_id,
        month=data.month,
        invested=data.invested,
        emotional_state=data.emotional_state,
        notes=data.notes,
    )
    db.add(checkin)
    try:
        await db.commit()
        await db.refresh(checkin)
        await event_bus.publish(CheckInVoltooid(
            aggregate_id=checkin.id,
            user_id=user_id,
            maand=checkin.month,
            heeft_belegd=checkin.invested,
            emotionele_staat=checkin.emotional_state,
        ))
        return checkin, True
    except IntegrityError:
        await db.rollback()
        existing = await db.scalar(
            select(CheckIn).where(
                CheckIn.user_id == user_id,
                CheckIn.month == data.month,
            )
        )
        return existing, False


async def get_checkins(db: AsyncSession, user_id: uuid.UUID) -> list[CheckIn]:
    """Haal alle check-ins op voor een gebruiker.

    Args:
        db: Async database sessie.
        user_id: UUID van de gebruiker.

    Returns:
        Lijst van CheckIn objecten, gesorteerd op maand (nieuwste eerst).
    """
    result = await db.execute(
        select(CheckIn)
        .where(CheckIn.user_id == user_id)
        .order_by(CheckIn.month.desc())
    )
    return list(result.scalars().all())
