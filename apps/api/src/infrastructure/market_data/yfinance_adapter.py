"""yfinance adapter — implementatie van MarketDataPort."""
import asyncio
import logging
from datetime import datetime, timezone

import yfinance as yf

from .interface import CurrentPrice, MarketDataPort, PricePoint

logger = logging.getLogger(__name__)

# Mapping ISIN → yfinance ticker (exchange-suffix nodig voor Europese ETFs)
# ISINs zijn afgeleid van de ETF-catalogus in src/data/etf_catalog.py
ISIN_TO_TICKER: dict[str, str] = {
    "IE00B4L5Y983": "IWDA.AS",   # iShares Core MSCI World — Euronext Amsterdam
    "IE00B3RBWM25": "VWRL.AS",   # Vanguard FTSE All-World — Euronext Amsterdam
    "IE00BK5BQT80": "VWCE.DE",   # Vanguard FTSE All-World Acc — XETRA
    "IE00B5BMR087": "SXR8.DE",   # iShares Core S&P 500 — XETRA
    "LU0274208692": "XDWD.DE",   # Xtrackers MSCI World — XETRA
    "IE00B4WXJJ64": "EMIM.AS",   # iShares Core EM IMI — Euronext Amsterdam
    "IE00B3F81R35": "IMEU.AS",   # iShares Core MSCI Europe — Euronext Amsterdam
    "IE00B4L5YC18": "AGGH.MI",   # iShares Core Global Agg Bond — Borsa Italiana
    "IE00B3F81409": "EUN5.DE",   # iShares € Govt Bond 3-5yr — XETRA
    "IE00B3XXRP09": "VAGF.MI",   # Vanguard Global Aggregate Bond — Borsa Italiana
}


class YFinanceAdapter(MarketDataPort):
    """Haal marktdata op via yfinance (gratis, geen API key)."""

    async def get_current_price(self, ticker: str) -> CurrentPrice | None:
        """Haal huidige koers op. Geeft None bij fouten — app crasht nooit.

        Args:
            ticker: yfinance ticker (bijv. 'IWDA.AS').

        Returns:
            CurrentPrice of None.
        """
        try:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, self._fetch_price, ticker)
        except Exception as exc:
            logger.warning("yfinance get_current_price fout voor %s: %s", ticker, exc)
            return None

    def _fetch_price(self, ticker: str) -> CurrentPrice | None:
        t = yf.Ticker(ticker)
        info = t.fast_info
        price = getattr(info, "last_price", None)
        currency = getattr(info, "currency", "EUR")
        if price is None:
            return None
        return CurrentPrice(
            isin=self._ticker_to_isin(ticker),
            ticker=ticker,
            koers_eur=round(float(price), 4),
            valuta=currency,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

    async def get_price_history(
        self, ticker: str, period: str = "1y"
    ) -> list[PricePoint]:
        """Haal koershistorie op via yfinance.

        Args:
            ticker: yfinance ticker.
            period: '1mo', '3mo', '6mo', '1y', '2y', '5y'.

        Returns:
            Lijst van PricePoint, leeg bij fouten.
        """
        try:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, self._fetch_history, ticker, period)
        except Exception as exc:
            logger.warning("yfinance get_price_history fout voor %s: %s", ticker, exc)
            return []

    def _fetch_history(self, ticker: str, period: str) -> list[PricePoint]:
        t = yf.Ticker(ticker)
        hist = t.history(period=period)
        points = []
        for ts, row in hist.iterrows():
            points.append(
                PricePoint(
                    datum=ts.date(),
                    slotkoers_eur=round(float(row["Close"]), 4),
                    volume=int(row["Volume"]) if row["Volume"] else None,
                )
            )
        return points

    @staticmethod
    def _ticker_to_isin(ticker: str) -> str:
        for isin, t in ISIN_TO_TICKER.items():
            if t == ticker:
                return isin
        return ticker
