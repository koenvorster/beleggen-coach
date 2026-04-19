"""Analytics router — ETF performance data en platform statistieken."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..services.analytics_service import (
    get_etf_metrics,
    get_etf_price_history,
    get_platform_stats,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/etf-metrics")
async def etf_metrics_endpoint(db: AsyncSession = Depends(get_db)) -> dict:
    """Haal berekende performance metrics op voor alle ETFs.

    Returns:
        Standaard succes-response met lijst van ETF metrics.
    """
    return {"success": True, "data": await get_etf_metrics(db), "error": None}


@router.get("/etf-history/{ticker}")
async def etf_history_endpoint(
    ticker: str,
    periode: str = Query("1y", description="Periode: 1m, 3m, 6m, 1y, 3y, 5y"),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Historische dagelijkse prijzen voor een specifieke ETF.

    Args:
        ticker: ETF-ticker (bijv. 'VWCE').
        periode: Tijdsperiode voor de historische data.
        db: Database-sessie.

    Returns:
        Standaard succes-response met lijst van datum/koers datapunten.
    """
    return {
        "success": True,
        "data": await get_etf_price_history(db, ticker, periode),
        "error": None,
    }


@router.get("/platform-stats")
async def platform_stats_endpoint(db: AsyncSession = Depends(get_db)) -> dict:
    """Anonieme platform statistieken.

    Returns:
        Standaard succes-response met geaggregeerde platformdata.
    """
    return {"success": True, "data": await get_platform_stats(db), "error": None}
