"""ETF router met Redis caching voor lijst- en detailopvragen."""
import structlog
from typing import Optional

from fastapi import APIRouter, Query

from ..cache import cache_get, cache_set
from ..data.etf_catalog import ETF_BY_ISIN, ETF_CATALOG

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/etfs", tags=["etfs"])


@router.get("", summary="Haal lijst van ETFs op")
async def list_etfs(
    categorie: Optional[str] = Query(None, description="Filter op categorie: aandelen, obligaties of gemengd"),
    regio: Optional[str] = Query(None, description="Filter op regio (bijv. 'World', 'Europa', 'USA')"),
    max_ter: Optional[float] = Query(None, description="Maximum Total Expense Ratio (bijv. 0.20)"),
    limit: int = Query(20, ge=1, le=100, description="Maximum aantal resultaten"),
) -> dict:
    """Geef een gefilterde lijst van ETFs terug, gecached voor 1 uur.

    Args:
        categorie: Filter op categorie (bijv. 'aandelen', 'obligaties').
        regio: Filter op regio (bijv. 'World', 'Europa').
        max_ter: Maximale Total Expense Ratio (bijv. 0.25).
        limit: Maximaal aantal resultaten (standaard 20).

    Returns:
        Standaard succes-response met count en etf-lijst.
    """
    cache_key = f"etfs:list:{categorie}:{regio}:{max_ter}:{limit}"
    cached = await cache_get(cache_key)
    if cached is not None:
        logger.debug("cache_hit", key=cache_key)
        return cached

    results = list(ETF_CATALOG)

    if categorie:
        results = [e for e in results if e["categorie"] == categorie]
    if regio:
        regio_lower = regio.lower()
        results = [e for e in results if e["regio"].lower() == regio_lower]
    if max_ter is not None:
        results = [e for e in results if e["expense_ratio"] <= max_ter]

    results = results[:limit]

    result = {
        "success": True,
        "data": {"count": len(results), "etfs": results},
        "error": None,
    }
    await cache_set(cache_key, result, ttl_seconds=3600)
    logger.info("etfs_listed", count=len(results), categorie=categorie, regio=regio, max_ter=max_ter)
    return result


@router.get("/{isin}", summary="Haal ETF-detail op via ISIN")
async def get_etf(isin: str) -> dict:
    """Geef details van één ETF terug op basis van ISIN, gecached voor 6 uur.

    Args:
        isin: De ISIN-code van het ETF (bijv. 'IE00B4L5Y983').

    Returns:
        Standaard succes-response met ETF-data, of fout als niet gevonden.
    """
    cache_key = f"etfs:detail:{isin.upper()}"
    cached = await cache_get(cache_key)
    if cached is not None:
        logger.debug("cache_hit", key=cache_key)
        return cached

    etf = ETF_BY_ISIN.get(isin.upper())
    if not etf:
        return {
            "success": False,
            "data": None,
            "error": {
                "code": "ETF_NOT_FOUND",
                "message": f"Geen ETF gevonden met ISIN '{isin}'.",
            },
        }

    result = {"success": True, "data": etf, "error": None}
    await cache_set(cache_key, result, ttl_seconds=21600)
    logger.info("etf_fetched", isin=isin.upper())
    return result

