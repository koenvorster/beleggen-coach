"""Portfolio service — business logic voor portefeuilleposities."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import PortfolioPosition
from ..schemas import PortfolioPositionCreate


async def get_positions(db: AsyncSession, user_id: uuid.UUID) -> list[PortfolioPosition]:
    """Haal alle portefeuilleposities op voor een gebruiker.

    Args:
        db: Async database sessie.
        user_id: UUID van de gebruiker.

    Returns:
        Lijst van PortfolioPosition objecten, gesorteerd op aankoopdatum (nieuwste eerst).
    """
    result = await db.execute(
        select(PortfolioPosition)
        .where(PortfolioPosition.user_id == user_id)
        .order_by(PortfolioPosition.buy_date.desc())
    )
    return list(result.scalars().all())


async def add_position(
    db: AsyncSession, user_id: uuid.UUID, data: PortfolioPositionCreate
) -> PortfolioPosition:
    """Voeg een nieuwe positie toe aan de portefeuille.

    Args:
        db: Async database sessie.
        user_id: UUID van de gebruiker.
        data: Validated PortfolioPositionCreate schema.

    Returns:
        De aangemaakte PortfolioPosition.
    """
    position = PortfolioPosition(
        id=uuid.uuid4(),
        user_id=user_id,
        etf_isin=data.etf_isin,
        etf_ticker=data.etf_ticker,
        shares=data.shares,
        buy_price_eur=data.buy_price_eur,
        buy_date=data.buy_date,
        notes=data.notes,
    )
    db.add(position)
    await db.commit()
    await db.refresh(position)
    return position


async def delete_position(
    db: AsyncSession, user_id: uuid.UUID, position_id: uuid.UUID
) -> bool:
    """Verwijder een positie uit de portefeuille.

    Args:
        db: Async database sessie.
        user_id: UUID van de gebruiker.
        position_id: UUID van de positie.

    Returns:
        True als verwijderd, False als niet gevonden.
    """
    position = await db.scalar(
        select(PortfolioPosition).where(
            PortfolioPosition.id == position_id,
            PortfolioPosition.user_id == user_id,
        )
    )
    if not position:
        return False

    await db.delete(position)
    await db.commit()
    return True
