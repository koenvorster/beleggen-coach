"""Portfolio router — posities in de portefeuille beheren."""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..schemas import PortfolioPositionCreate, PortfolioPositionResponse
from ..services.portfolio_service import add_position, delete_position, get_positions

router = APIRouter(tags=["portfolio"])


@router.get("/users/{user_id}/positions", response_model=list[PortfolioPositionResponse])
async def list_positions(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[PortfolioPositionResponse]:
    """Haal alle portefeuilleposities op voor een gebruiker.

    Args:
        user_id: UUID van de gebruiker.
        db: Async database sessie (DI).

    Returns:
        Lijst van posities, nieuwste aankoopdatum eerst.
    """
    return await get_positions(db, user_id)


@router.post("/users/{user_id}/positions", response_model=PortfolioPositionResponse, status_code=201)
async def create_position(
    user_id: uuid.UUID,
    data: PortfolioPositionCreate,
    db: AsyncSession = Depends(get_db),
) -> PortfolioPositionResponse:
    """Voeg een nieuwe ETF-positie toe aan de portefeuille.

    Args:
        user_id: UUID van de gebruiker.
        data: Positie-data inclusief ISIN, ticker, aandelen en aankoopprijs.
        db: Async database sessie (DI).

    Returns:
        De aangemaakte positie.
    """
    return await add_position(db, user_id, data)


@router.delete("/users/{user_id}/positions/{position_id}", status_code=204)
async def remove_position(
    user_id: uuid.UUID,
    position_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Verwijder een positie uit de portefeuille.

    Args:
        user_id: UUID van de gebruiker.
        position_id: UUID van de te verwijderen positie.
        db: Async database sessie (DI).

    Raises:
        HTTPException: 404 als de positie niet gevonden is.
    """
    deleted = await delete_position(db, user_id, position_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Positie niet gevonden.")
