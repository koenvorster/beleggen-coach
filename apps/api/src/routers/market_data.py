"""Marktdata router — koersen en historische data via ACL."""
import dataclasses
import logging
from typing import Literal

from fastapi import APIRouter, Query

from ..infrastructure.market_data.cached_adapter import CachedMarketDataAdapter
from ..infrastructure.market_data.yfinance_adapter import ISIN_TO_TICKER, YFinanceAdapter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/market", tags=["marktdata"])

_adapter = CachedMarketDataAdapter(YFinanceAdapter())


@router.get("/price/{isin}", summary="Huidige koers van een ETF")
async def get_price(isin: str) -> dict:
    """Geef de huidige koers van een ETF terug op basis van ISIN.

    Args:
        isin: ISIN-code van het ETF (bijv. 'IE00B4L5Y983').

    Returns:
        Standaard succes-response met koersdata.
    """
    ticker = ISIN_TO_TICKER.get(isin.upper())
    if not ticker:
        return {
            "success": False,
            "data": None,
            "error": {
                "code": "ETF_NOT_FOUND",
                "message": f"Geen ticker gevonden voor ISIN '{isin}'.",
            },
        }
    price = await _adapter.get_current_price(ticker)
    if not price:
        return {
            "success": False,
            "data": None,
            "error": {
                "code": "PRICE_UNAVAILABLE",
                "message": "Koers tijdelijk niet beschikbaar.",
            },
        }
    return {"success": True, "data": dataclasses.asdict(price), "error": None}


@router.get("/history/{isin}", summary="Koershistorie van een ETF")
async def get_history(
    isin: str,
    period: Literal["1mo", "3mo", "6mo", "1y", "2y", "5y"] = Query("1y"),
) -> dict:
    """Geef de koershistorie van een ETF terug.

    Args:
        isin: ISIN-code van het ETF.
        period: Periode: '1mo', '3mo', '6mo', '1y', '2y', '5y'.

    Returns:
        Standaard succes-response met lijst van datapunten.
    """
    ticker = ISIN_TO_TICKER.get(isin.upper())
    if not ticker:
        return {
            "success": False,
            "data": None,
            "error": {
                "code": "ETF_NOT_FOUND",
                "message": f"Geen ticker gevonden voor ISIN '{isin}'.",
            },
        }
    history = await _adapter.get_price_history(ticker, period)
    serialized = [
        {"datum": p.datum.isoformat(), "slotkoers_eur": p.slotkoers_eur, "volume": p.volume}
        for p in history
    ]
    return {
        "success": True,
        "data": {
            "isin": isin.upper(),
            "ticker": ticker,
            "period": period,
            "count": len(serialized),
            "history": serialized,
        },
        "error": None,
    }
