"""Marktdata router — koersen en historische data via ACL."""
import logging
from typing import Literal

from fastapi import APIRouter, Query

from ..infrastructure.market_data.cached_adapter import CachedMarketDataAdapter
from ..infrastructure.market_data.yfinance_adapter import YFinanceAdapter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/market", tags=["marktdata"])

_adapter = CachedMarketDataAdapter(YFinanceAdapter())


@router.get("/price/{isin}", summary="Huidige koers van een ETF")
async def get_price(isin: str) -> dict:
    """Geef de huidige koers van een ETF terug op basis van ISIN.

    Resultaat wordt 15 minuten gecached in Redis (key: ``market:price:{isin}``).

    Args:
        isin: ISIN-code van het ETF (bijv. 'IE00B4L5Y983').

    Returns:
        Standaard succes-response ``{ success, data: { isin, ticker, price,
        currency, timestamp }, error }``.
    """
    return await _adapter.get_price(isin)


@router.get("/history/{isin}", summary="Koershistorie van een ETF")
async def get_history(
    isin: str,
    period: Literal["1mo", "3mo", "6mo", "1y", "2y", "5y"] = Query("1y"),
) -> dict:
    """Geef de koershistorie van een ETF terug.

    Resultaat wordt 1 uur gecached in Redis (key: ``market:history:{isin}:{period}``).

    Args:
        isin: ISIN-code van het ETF.
        period: Periode: '1mo', '3mo', '6mo', '1y', '2y', '5y'.

    Returns:
        Standaard succes-response ``{ success, data: { isin, ticker, period,
        data: [{ date, close, volume }] }, error }``.
    """
    return await _adapter.get_history(isin, period)
