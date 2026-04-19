"""Redis-cached wrapper rond MarketDataPort."""
import dataclasses
import logging
from datetime import date

from ...cache import cache_get, cache_set
from .interface import CurrentPrice, MarketDataPort, PricePoint

logger = logging.getLogger(__name__)

PRICE_TTL = 900     # 15 minuten voor huidige koers
HISTORY_TTL = 3600  # 1 uur voor koershistorie


class CachedMarketDataAdapter(MarketDataPort):
    """Decorator die Redis-caching toevoegt aan een MarketDataPort."""

    def __init__(self, inner: MarketDataPort) -> None:
        self._inner = inner

    async def get_current_price(self, ticker: str) -> CurrentPrice | None:
        """Geef de huidige koers terug, gecached in Redis.

        Args:
            ticker: yfinance ticker (bijv. 'IWDA.AS').

        Returns:
            CurrentPrice uit cache of live, None bij fout.
        """
        key = f"market:price:{ticker}"
        cached = await cache_get(key)
        if cached:
            return CurrentPrice(**cached)
        result = await self._inner.get_current_price(ticker)
        if result:
            await cache_set(key, dataclasses.asdict(result), ttl_seconds=PRICE_TTL)
        return result

    async def get_price_history(
        self, ticker: str, period: str = "1y"
    ) -> list[PricePoint]:
        """Geef de koershistorie terug, gecached in Redis.

        Args:
            ticker: yfinance ticker.
            period: '1mo', '3mo', '6mo', '1y', '2y', '5y'.

        Returns:
            Lijst van PricePoint uit cache of live, leeg bij fout.
        """
        key = f"market:history:{ticker}:{period}"
        cached = await cache_get(key)
        if cached:
            return [
                PricePoint(
                    datum=date.fromisoformat(p["datum"]),
                    slotkoers_eur=p["slotkoers_eur"],
                    volume=p.get("volume"),
                )
                for p in cached
            ]
        result = await self._inner.get_price_history(ticker, period)
        if result:
            serializable = [
                {
                    "datum": p.datum.isoformat(),
                    "slotkoers_eur": p.slotkoers_eur,
                    "volume": p.volume,
                }
                for p in result
            ]
            await cache_set(key, serializable, ttl_seconds=HISTORY_TTL)
        return result
