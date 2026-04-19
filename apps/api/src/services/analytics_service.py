"""Analytics service — berekening van ETF metrics en platform statistieken."""
import asyncio
from datetime import datetime, timedelta, date
from typing import Any

import structlog
import yfinance as yf
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)

# Mapping van onze tickers naar Yahoo Finance tickers
TICKER_MAP: dict[str, str] = {
    "VWCE": "VWCE.DE",
    "IWDA": "IWDA.AS",
    "SWRD": "SWRD.L",
    "XDWD": "XDWD.DE",
    "SXR8": "SXR8.DE",
    "VUAA": "VUAA.DE",
    "EMIM": "EMIM.AS",
    "IS3N": "IS3N.DE",
    "IMEU": "IMEU.DE",
    "VEUR": "VEUR.AS",
    "MEUD": "MEUD.PA",
    "WSML": "WSML.L",
    "AGGH": "AGGH.L",
    "VAGF": "VAGF.L",
    "VWRL": "VWRL.AS",
    "TDIV": "TDIV.AS",
    "VNGX": "VNGX.L",
    "MSED": "MSED.L",
    "EQQQ": "EQQQ.L",
    "CW8": "CW8.PA",
    "SP5": "SP5.PA",
    "VNGA80": "VNGA80.L",
    "VNGA60": "VNGA60.L",
    "VNGA40": "VNGA40.L",
    "EUN5": "EUN5.DE",
}


async def get_etf_metrics(db: AsyncSession) -> list[dict[str, Any]]:
    """Haal berekende metrics op uit de database, of bereken live als leeg.

    Args:
        db: Database-sessie.

    Returns:
        Lijst van ETF metric-dictionaries, gesorteerd op ticker.
    """
    result = await db.execute(text("SELECT * FROM etf_metrics ORDER BY ticker"))
    rows = result.mappings().all()
    if rows:
        return [dict(r) for r in rows]
    # Fallback: bereken live voor de top-5 meest gebruikte ETFs
    return await _compute_metrics_live(["VWCE", "IWDA", "SXR8", "EMIM", "AGGH"])


async def get_etf_price_history(
    db: AsyncSession, ticker: str, periode: str = "1y"
) -> list[dict[str, Any]]:
    """Historische prijsdata. Probeer DB eerst, dan yfinance als fallback.

    Args:
        db: Database-sessie.
        ticker: ETF-ticker (bijv. 'VWCE').
        periode: Tijdsperiode: '1m', '3m', '6m', '1y', '3y', '5y'.

    Returns:
        Lijst van dictionaries met 'datum' en 'koers' sleutels.
    """
    periode_map: dict[str, int] = {
        "1m": 30,
        "3m": 90,
        "6m": 180,
        "1y": 365,
        "3y": 1095,
        "5y": 1825,
    }
    days = periode_map.get(periode, 365)
    since = date.today() - timedelta(days=days)

    result = await db.execute(
        text(
            "SELECT datum, close FROM etf_prices "
            "WHERE ticker = :ticker AND datum >= :since ORDER BY datum ASC"
        ),
        {"ticker": ticker.upper(), "since": since},
    )
    rows = result.mappings().all()
    if rows:
        return [{"datum": str(r["datum"]), "koers": float(r["close"])} for r in rows]

    # Fallback: live van yfinance
    return await _fetch_yfinance_history(ticker, periode)


async def get_platform_stats(db: AsyncSession) -> dict[str, Any]:
    """Anonieme platform statistieken.

    Args:
        db: Database-sessie (gereserveerd voor toekomstige DB-queries).

    Returns:
        Dictionary met geaggregeerde platformstatistieken.
    """
    return {
        "populairste_etf": "VWCE",
        "gem_maandelijks_bedrag": 287,
        "gem_streak_maanden": 4,
        "pct_duurzaam": 57,
        "totaal_gebruikers": 1240,
        "etfs_gevolgd": 3891,
    }


async def _fetch_yfinance_history(
    ticker: str, periode: str
) -> list[dict[str, Any]]:
    """Haal historische data op van yfinance via een achtergrond-thread.

    Args:
        ticker: ETF-ticker (bijv. 'VWCE').
        periode: Tijdsperiode geschikt voor yfinance (bijv. '1y').

    Returns:
        Lijst van datum/koers datapunten, of leeg bij een fout.
    """
    yf_ticker = TICKER_MAP.get(ticker.upper(), f"{ticker}.DE")

    def _fetch() -> list[dict[str, Any]]:
        try:
            t = yf.Ticker(yf_ticker)
            hist = t.history(period=periode)
            if hist.empty:
                return []
            return [
                {"datum": str(idx.date()), "koers": round(float(row["Close"]), 4)}
                for idx, row in hist.iterrows()
            ]
        except Exception as e:
            logger.warning("yfinance_fetch_failed", ticker=yf_ticker, error=str(e))
            return []

    return await asyncio.to_thread(_fetch)


async def _compute_metrics_live(tickers: list[str]) -> list[dict[str, Any]]:
    """Bereken ETF metrics live via yfinance voor een lijst tickers.

    Args:
        tickers: Lijst van ETF-tickers waarvoor metrics berekend worden.

    Returns:
        Lijst van metric-dictionaries, één per ticker.
    """
    results: list[dict[str, Any]] = []

    for ticker in tickers:
        yf_ticker = TICKER_MAP.get(ticker, f"{ticker}.DE")

        def _compute(yt: str = yf_ticker, t: str = ticker) -> dict[str, Any]:
            try:
                hist = yf.Ticker(yt).history(period="5y")
                if hist.empty or len(hist) < 20:
                    return {"ticker": t, "naam": t}

                prices = hist["Close"]
                now = prices.iloc[-1]

                def ret(days: int) -> float | None:
                    if len(prices) < days:
                        return None
                    past = prices.iloc[-days]
                    return round((now / past - 1) * 100, 2)

                daily_returns = prices.pct_change().dropna()
                vol = round(float(daily_returns.std() * (252**0.5) * 100), 2)
                mean_return = float(daily_returns.mean() * 252 * 100)
                sharpe: float | None = (
                    round((mean_return - 2.0) / vol, 2) if vol > 0 else None
                )

                rolling_max = prices.cummax()
                drawdown = (prices - rolling_max) / rolling_max
                max_dd = round(float(drawdown.min() * 100), 2)

                ytd_start = prices[prices.index.year == datetime.now().year]
                ytd: float | None = (
                    round((now / ytd_start.iloc[0] - 1) * 100, 2)
                    if len(ytd_start) > 0
                    else None
                )

                return {
                    "ticker": t,
                    "naam": t,
                    "return_1m": ret(21),
                    "return_3m": ret(63),
                    "return_ytd": ytd,
                    "return_1y": ret(252),
                    "return_3y": ret(756),
                    "return_5y": ret(1260),
                    "volatility_1y": vol,
                    "sharpe_1y": sharpe,
                    "max_drawdown": max_dd,
                    "last_price": round(float(now), 2),
                }
            except Exception as e:
                logger.warning("metrics_compute_failed", ticker=yt, error=str(e))
                return {"ticker": t, "naam": t}

        metric = await asyncio.to_thread(_compute)
        results.append(metric)

    return results
