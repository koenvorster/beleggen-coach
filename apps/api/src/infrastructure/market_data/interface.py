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
