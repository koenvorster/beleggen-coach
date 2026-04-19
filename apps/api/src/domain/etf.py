"""ETF domain entity — kernlogica voor ETF-selectie en scoring."""
from __future__ import annotations
from dataclasses import dataclass
from typing import Literal

from .value_objects import BeleggingsProfiel, Geld, ISIN, ETFTicker

ETFCategorie = Literal["aandelen", "obligaties", "gemengd"]


@dataclass(frozen=True)
class ETFEntity:
    """Domain entity voor een ETF — bevat business logica voor geschiktheid.

    Attrs:
        isin: ISIN value object.
        ticker: Ticker value object.
        naam: Volledige naam van het ETF.
        categorie: ETF categorie.
        expense_ratio: Jaarlijkse kosten als decimaal (bijv. 0.002 = 0.2%).
        beginner_score: Geschiktheidsscore voor beginners (0-100).
        accumulating: True als het ETF herbelegt (accumulerend).
        volatility_3y: 3-jarige volatiliteit als percentage.
    """
    isin: ISIN
    ticker: ETFTicker
    naam: str
    categorie: ETFCategorie
    expense_ratio: float
    beginner_score: int
    accumulating: bool
    volatility_3y: float

    def is_geschikt_voor_profiel(self, profiel: BeleggingsProfiel) -> bool:
        """Bepaal of dit ETF past bij het beleggersprofiel.

        Args:
            profiel: Het beleggersprofiel van de gebruiker.

        Returns:
            True als het ETF geschikt is, anders False.
        """
        if profiel.risico == "laag" and self.categorie == "aandelen" and self.volatility_3y > 12.0:
            return False
        if profiel.risico == "hoog" and profiel.horizon_jaren >= 10 and self.categorie == "obligaties":
            return False
        return True

    def jaarlijkse_kosten(self, maandbudget: Geld) -> Geld:
        """Bereken jaarlijkse kosten op basis van maandbudget.

        Args:
            maandbudget: Maandelijks te beleggen bedrag.

        Returns:
            Geschatte jaarlijkse kostenpost.
        """
        jaarlijks = maandbudget * 12
        return jaarlijks * self.expense_ratio

    @property
    def is_goedkoop(self) -> bool:
        """Een ETF is goedkoop als de TER onder 0.25% ligt."""
        return self.expense_ratio < 0.0025
