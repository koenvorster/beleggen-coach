"""Marktdata router — koersen en historische data via ACL."""
import structlog

from fastapi import APIRouter, Query

from ..infrastructure.market_data.cached_adapter import CachedMarketDataAdapter
from ..infrastructure.market_data.yfinance_adapter import YFinanceAdapter

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/market", tags=["marktdata"])

_adapter = CachedMarketDataAdapter(YFinanceAdapter())

# Bekende marktindexen en ETFs voor het marktoverzicht
MARKT_INDICES = [
    {"ticker": "^GSPC", "naam": "S&P 500"},
    {"ticker": "IWDA.AS", "naam": "MSCI World (IWDA)"},
    {"ticker": "^AEX", "naam": "AEX Index"},
    {"ticker": "^BFX", "naam": "BEL 20"},
    {"ticker": "VWCE.DE", "naam": "VWCE ETF"},
    {"ticker": "^IXIC", "naam": "NASDAQ"},
]

# Periode-mapping: frontend-waarden → yfinance-waarden
_PERIODE_MAP: dict[str, str] = {
    "1m": "1mo",
    "3m": "3mo",
    "6m": "6mo",
    "1y": "1y",
    "3y": "5y",
    # Backward compat: doorgeven als-is
    "1mo": "1mo",
    "3mo": "3mo",
    "6mo": "6mo",
    "2y": "2y",
    "5y": "5y",
}


def _is_isin(value: str) -> bool:
    """Detecteer of een waarde een ISIN-code is (12 tekens, begint met 2 letters)."""
    return len(value) == 12 and value[:2].isalpha() and value[2:].isalnum()


@router.get("/indices", summary="Actuele koersen voor bekende marktindexen en ETFs")
async def get_indices() -> list[dict]:
    """Geef actuele koersen terug voor de bekende marktindexen en ETFs.

    Resultaat wordt 15 minuten gecached per ticker.

    Returns:
        Lijst met per index: ticker, naam, huidige_koers, wijziging_pct,
        wijziging_eur, valuta.
    """
    results = []
    for idx in MARKT_INDICES:
        info = await _adapter.get_index_info(idx["ticker"])
        if info:
            results.append({**info, "naam": idx["naam"]})
        else:
            logger.warning("Geen data beschikbaar voor %s", idx["ticker"])
    return results


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


@router.get("/history/{identifier}", summary="Koershistorie van een ETF of index")
async def get_history(
    identifier: str,
    periode: str = Query("1y", description="Periode: 1m, 3m, 6m, 1y, 3y"),
    period: str | None = Query(None, description="Legacy alias voor periode (1mo, 3mo, 6mo, 1y, 2y, 5y)"),
) -> dict:
    """Geef de koershistorie terug voor een ISIN of yfinance ticker.

    Ondersteunt ISIN-codes (bijv. 'IE00B4L5Y983') én tickers (bijv. '^GSPC',
    'IWDA.AS'). De ``period``-parameter is een legacy alias.

    Resultaat wordt 1 uur gecached in Redis.

    Args:
        identifier: ISIN-code of yfinance ticker.
        periode: Periode: '1m', '3m', '6m', '1y', '3y' (default '1y').
        period: Legacy alias: '1mo', '3mo', '6mo', '1y', '2y', '5y'.

    Returns:
        Succes-response met koersdata.
    """
    raw = period or periode
    yf_period = _PERIODE_MAP.get(raw, "1y")

    if _is_isin(identifier):
        return await _adapter.get_history(identifier, yf_period)

    # Directe ticker (bijv. ^GSPC, IWDA.AS, ^AEX)
    points = await _adapter.get_price_history(identifier, yf_period)
    return {
        "success": True,
        "data": [
            {"datum": p.datum.isoformat(), "koers": p.slotkoers_eur}
            for p in points
        ],
        "error": None,
    }
