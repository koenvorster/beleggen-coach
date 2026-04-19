"""yfinance adapter — implementatie van MarketDataPort."""
import asyncio
import structlog
from datetime import datetime, timezone

import yfinance as yf

from .interface import CurrentPrice, MarketDataPort, PricePoint

logger = structlog.get_logger(__name__)

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

# Geldige periodes voor yfinance (ook aliassen zonder 'o'-suffix worden genormaliseerd)
_PERIOD_ALIASES: dict[str, str] = {
    "1m": "1mo",
    "3m": "3mo",
    "6m": "6mo",
}


def _normalize_period(period: str) -> str:
    """Normaliseer een periode-string naar het yfinance-formaat.

    Args:
        period: Periode zoals '1m', '3m', '1y', '2y', '5y'.

    Returns:
        yfinance-compatibele periode (bijv. '1mo', '3mo', '1y').
    """
    return _PERIOD_ALIASES.get(period, period)


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
            return await asyncio.to_thread(self._fetch_price, ticker)
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
            return await asyncio.to_thread(
                self._fetch_history, ticker, _normalize_period(period)
            )
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

    async def get_index_info(self, ticker: str) -> dict | None:
        """Haal actuele koers en dagwijziging op voor een index- of ETF-ticker.

        Args:
            ticker: yfinance ticker (bijv. '^GSPC', 'IWDA.AS').

        Returns:
            Dict met ticker, huidige_koers, wijziging_pct, wijziging_eur, valuta
            of None bij fout.
        """
        try:
            return await asyncio.to_thread(self._fetch_index_info, ticker)
        except Exception as exc:
            logger.warning("yfinance get_index_info fout voor %s: %s", ticker, exc)
            return None

    def _fetch_index_info(self, ticker: str) -> dict | None:
        t = yf.Ticker(ticker)
        info = t.fast_info
        price = getattr(info, "last_price", None)
        prev_close = getattr(info, "previous_close", None)
        currency = getattr(info, "currency", "EUR")
        if price is None:
            return None
        price_f = float(price)
        prev_f = float(prev_close) if prev_close else None
        wijziging_eur = (price_f - prev_f) if prev_f else 0.0
        wijziging_pct = (wijziging_eur / prev_f * 100) if prev_f else 0.0
        return {
            "ticker": ticker,
            "huidige_koers": round(price_f, 4),
            "wijziging_pct": round(wijziging_pct, 4),
            "wijziging_eur": round(wijziging_eur, 4),
            "valuta": currency,
        }

    async def get_price(self, isin: str) -> dict:
        """Haal de huidige koers op via ISIN.

        Args:
            isin: ISIN-code van het ETF (bijv. 'IE00B4L5Y983').

        Returns:
            Standaard response ``{ success, data: { isin, ticker, price,
            currency, timestamp }, error }``.
        """
        isin_upper = isin.upper()
        ticker = ISIN_TO_TICKER.get(isin_upper)
        if not ticker:
            return {
                "success": False,
                "data": None,
                "error": {
                    "code": "ETF_NOT_FOUND",
                    "message": f"Geen ticker gevonden voor ISIN '{isin}'.",
                },
            }
        price = await self.get_current_price(ticker)
        if not price:
            return {
                "success": False,
                "data": None,
                "error": {
                    "code": "PRICE_UNAVAILABLE",
                    "message": "Koers tijdelijk niet beschikbaar.",
                },
            }
        return {
            "success": True,
            "data": {
                "isin": price.isin,
                "ticker": price.ticker,
                "price": price.koers_eur,
                "currency": price.valuta,
                "timestamp": price.timestamp,
            },
            "error": None,
        }

    async def get_history(self, isin: str, period: str = "1y") -> dict:
        """Haal koershistorie op via ISIN.

        Args:
            isin: ISIN-code van het ETF.
            period: Periode string: '1mo', '3mo', '6mo', '1y', '2y', '5y'
                (of aliassen '1m', '3m', '6m').

        Returns:
            Standaard response ``{ success, data: { isin, ticker, period,
            data: [{ date, close, volume }] }, error }``.
        """
        isin_upper = isin.upper()
        ticker = ISIN_TO_TICKER.get(isin_upper)
        if not ticker:
            return {
                "success": False,
                "data": None,
                "error": {
                    "code": "ETF_NOT_FOUND",
                    "message": f"Geen ticker gevonden voor ISIN '{isin}'.",
                },
            }
        normalized = _normalize_period(period)
        history = await self.get_price_history(ticker, normalized)
        return {
            "success": True,
            "data": {
                "isin": isin_upper,
                "ticker": ticker,
                "period": normalized,
                "data": [
                    {
                        "date": p.datum.isoformat(),
                        "close": p.slotkoers_eur,
                        "volume": p.volume,
                    }
                    for p in history
                ],
            },
            "error": None,
        }

    @staticmethod
    def _ticker_to_isin(ticker: str) -> str:
        for isin, t in ISIN_TO_TICKER.items():
            if t == ticker:
                return isin
        return ticker
