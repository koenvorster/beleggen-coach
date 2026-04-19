"""Abstracte interface voor marktdata — Anti-Corruption Layer."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date


@dataclass
class PricePoint:
    """Eén datapunt in een koershistorie."""

    datum: date
    slotkoers_eur: float
    volume: int | None = None


@dataclass
class CurrentPrice:
    """Huidige koers van een ETF."""

    isin: str
    ticker: str
    koers_eur: float
    valuta: str
    timestamp: str  # ISO 8601


class MarketDataPort(ABC):
    """Port (interface) voor marktdata — implementaties mogen wisselen."""

    @abstractmethod
    async def get_current_price(self, ticker: str) -> CurrentPrice | None:
        """Haal de huidige koers op voor een ticker.

        Args:
            ticker: ETF ticker (bijv. 'IWDA.AS' of 'VWCE.DE').

        Returns:
            CurrentPrice of None als niet beschikbaar.
        """

    @abstractmethod
    async def get_price_history(
        self, ticker: str, period: str = "1y"
    ) -> list[PricePoint]:
        """Haal koershistorie op.

        Args:
            ticker: ETF ticker.
            period: Periode string: '1mo', '3mo', '6mo', '1y', '2y', '5y'.

        Returns:
            Lijst van PricePoint, chronologisch gesorteerd.
        """

    @abstractmethod
    async def get_price(self, isin: str) -> dict:
        """Haal de huidige koers op via ISIN, retourneert een standaard response-dict.

        Args:
            isin: ISIN-code van het ETF (bijv. 'IE00B4L5Y983').

        Returns:
            Standaard succes-response ``{ success, data: { isin, ticker, price,
            currency, timestamp }, error }``.
        """

    @abstractmethod
    async def get_index_info(self, ticker: str) -> dict | None:
        """Haal actuele koers en dagwijziging op voor een index- of ETF-ticker.

        Args:
            ticker: yfinance ticker (bijv. '^GSPC', 'IWDA.AS').

        Returns:
            Dict met ticker, huidige_koers, wijziging_pct, wijziging_eur, valuta
            of None bij fout.
        """

    @abstractmethod
    async def get_history(self, isin: str, period: str = "1y") -> dict:
        """Haal koershistorie op via ISIN, retourneert een standaard response-dict.

        Args:
            isin: ISIN-code van het ETF.
            period: Periode string: '1mo', '3mo', '6mo', '1y', '2y', '5y'.

        Returns:
            Standaard succes-response ``{ success, data: { isin, ticker, period,
            data: [{ date, close, volume }] }, error }``.
        """
