"""Redis-cached wrapper rond MarketDataPort."""
import dataclasses
import structlog
from datetime import date

from ...cache import cache_get, cache_set
from .interface import CurrentPrice, MarketDataPort, PricePoint

logger = structlog.get_logger(__name__)

PRICE_TTL = 900     # 15 minuten voor huidige koers
HISTORY_TTL = 3600  # 1 uur voor koershistorie


class CachedMarketDataAdapter(MarketDataPort):
    """Decorator die Redis-caching toevoegt aan een MarketDataPort."""

    def __init__(self, inner: MarketDataPort) -> None:
        self._inner = inner

    async def get_current_price(self, ticker: str) -> CurrentPrice | None:
        """Geef de huidige koers terug, gecached in Redis (op ticker-basis).

        Args:
            ticker: yfinance ticker (bijv. 'IWDA.AS').

        Returns:
            CurrentPrice uit cache of live, None bij fout.
        """
        key = f"market:price:ticker:{ticker}"
        cached = await cache_get(key)
        if cached is not None:
            logger.debug("Cache hit voor %s", key)
            return CurrentPrice(**cached)
        logger.debug("Cache miss voor %s", key)
        result = await self._inner.get_current_price(ticker)
        if result:
            await cache_set(key, dataclasses.asdict(result), ttl_seconds=PRICE_TTL)
        return result

    async def get_price_history(
        self, ticker: str, period: str = "1y"
    ) -> list[PricePoint]:
        """Geef de koershistorie terug, gecached in Redis (op ticker-basis).

        Args:
            ticker: yfinance ticker.
            period: '1mo', '3mo', '6mo', '1y', '2y', '5y'.

        Returns:
            Lijst van PricePoint uit cache of live, leeg bij fout.
        """
        key = f"market:history:ticker:{ticker}:{period}"
        cached = await cache_get(key)
        if cached is not None:
            logger.debug("Cache hit voor %s", key)
            return [
                PricePoint(
                    datum=date.fromisoformat(p["datum"]),
                    slotkoers_eur=p["slotkoers_eur"],
                    volume=p.get("volume"),
                )
                for p in cached
            ]
        logger.debug("Cache miss voor %s", key)
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

    async def get_index_info(self, ticker: str) -> dict | None:
        """Geef actuele koers en dagwijziging terug voor een index-ticker, gecached.

        Cache key: ``market:index:{ticker}``, TTL: 15 minuten.

        Args:
            ticker: yfinance ticker (bijv. '^GSPC', 'IWDA.AS').

        Returns:
            Dict of None bij fout.
        """
        key = f"market:index:{ticker}"
        cached = await cache_get(key)
        if cached is not None:
            logger.debug("Cache hit voor %s", key)
            return cached
        logger.debug("Cache miss voor %s", key)
        result = await self._inner.get_index_info(ticker)
        if result:
            await cache_set(key, result, ttl_seconds=PRICE_TTL)
        return result

    async def get_price(self, isin: str) -> dict:
        """Geef de huidige koers terug via ISIN, gecached in Redis.

        Cache key: ``market:price:{isin}``, TTL: 15 minuten.

        Args:
            isin: ISIN-code van het ETF.

        Returns:
            Standaard response-dict uit cache of live.
        """
        isin_upper = isin.upper()
        key = f"market:price:{isin_upper}"
        cached = await cache_get(key)
        if cached is not None:
            logger.debug("Cache hit voor %s", key)
            return cached
        logger.debug("Cache miss voor %s", key)
        result = await self._inner.get_price(isin_upper)
        if result.get("success"):
            await cache_set(key, result, ttl_seconds=PRICE_TTL)
        return result

    async def get_history(self, isin: str, period: str = "1y") -> dict:
        """Geef de koershistorie terug via ISIN, gecached in Redis.

        Cache key: ``market:history:{isin}:{period}``, TTL: 1 uur.

        Args:
            isin: ISIN-code van het ETF.
            period: '1mo', '3mo', '6mo', '1y', '2y', '5y'.

        Returns:
            Standaard response-dict uit cache of live.
        """
        isin_upper = isin.upper()
        key = f"market:history:{isin_upper}:{period}"
        cached = await cache_get(key)
        if cached is not None:
            logger.debug("Cache hit voor %s", key)
            return cached
        logger.debug("Cache miss voor %s", key)
        result = await self._inner.get_history(isin_upper, period)
        if result.get("success"):
            await cache_set(key, result, ttl_seconds=HISTORY_TTL)
        return result
