"""ETF domain aggregate — DDD pattern met kernlogica voor ETF-selectie.

Dit bestand bevat de ETFProduct aggregate root en gerelateerde domain logic.
"""
from __future__ import annotations
from dataclasses import dataclass
from datetime import date, datetime
from typing import Literal, Optional

import structlog

from .value_objects import (
    BeleggingsProfiel,
    DividendYield,
    ETFScore,
    Geld,
    ISIN,
    TER,
)

logger = structlog.get_logger(__name__)

ETFCategory = Literal["equity", "bond", "mixed", "real_estate", "commodity"]


@dataclass(frozen=True)
class ETFProduct:
    """DDD Aggregate Root voor een ETF-product.
    
    Immutable nadat aangemaakt. Bevat alle domeinlogica voor ETF-geschiktheid
    en kostenberekening. Dit is de kernentiteit waar alle ETF-queries omheen
    moet gebeuren.
    
    Attributes:
        isin: ISIN value object (aggregate root ID)
        name: Volledige naam van het ETF
        description: Beschrijving en karakteristieken
        category: ETF categorie (equity, bond, mixed, real_estate, commodity)
        ter: Total Expense Ratio (value object)
        risk_score: Risicoscore 1-7 (value object)
        dividend_yield: Jaarlijkse dividendrendement (value object)
        inception_date: Oprichtingsdatum van het ETF
        is_accumulating: True als het dividenden herbelegt
        benchmark: Referentiebenchmark (bijv. MSCI World)
        currency: Valuta (standaard EUR)
        fund_size_m: Grootte van het fonds in miljoen EUR
        ytd_return: Year-to-date rendement (%)
        one_year_return: 1-jaars rendement (%)
        three_year_return: 3-jaars rendement (%)
        replication_method: Fysieke of synthetische replicatie
        domicile: Vestigingsland (bijv. IE voor Ierland)
    """
    isin: ISIN
    name: str
    description: Optional[str]
    category: ETFCategory
    ter: TER
    risk_score: ETFScore
    dividend_yield: DividendYield
    inception_date: Optional[date]
    is_accumulating: bool
    benchmark: Optional[str]
    currency: str = "EUR"
    fund_size_m: Optional[float] = None
    ytd_return: Optional[float] = None
    one_year_return: Optional[float] = None
    three_year_return: Optional[float] = None
    replication_method: str = "physical"
    domicile: str = "IE"

    def is_suitable_for(self, investor_profile: BeleggingsProfiel) -> bool:
        """Bepaal of dit ETF geschikt is voor het beleggersprofiel.
        
        Logica:
        - Aandelen-ETFs (category="equity"): alleen geschikt als profiel
          minstens "matig" risico heeft EN horizon >= 5 jaar
        - Obligatie-ETFs (category="bond"): geschikt voor alle profielen
        - Gemengde/andere: geschikt als risk_score level <= risico van profiel
        
        Args:
            investor_profile: InvestorProfile value object
            
        Returns:
            True als geschikt, False anders
        """
        # Map risico niveaus naar score levels
        risk_to_level = {"laag": 2, "matig": 4, "hoog": 6}
        max_risk_level = risk_to_level.get(investor_profile.risico, 3)
        
        # Check risicoscore
        if self.risk_score.level > max_risk_level:
            logger.debug(
                "unsuitable_risk",
                isin=str(self.isin),
                etf_risk=self.risk_score.level,
                max_allowed=max_risk_level,
            )
            return False
        
        # Aandelen-ETFs vereisen langer horizon
        if self.category == "equity" and investor_profile.horizon_jaren < 5:
            logger.debug(
                "unsuitable_horizon",
                isin=str(self.isin),
                horizon=investor_profile.horizon_jaren,
            )
            return False
        
        return True

    def annual_fee_on(self, investment_amount: Geld) -> Geld:
        """Bereken jaarlijkse kosten op basis van investeringsbedrag.
        
        Args:
            investment_amount: Geld value object met investeringsbedrag
            
        Returns:
            Geld value object met geschatte jaarlijkse kosten
            
        Raises:
            ValueError: Als investeringsbedrag negatief is
        """
        if investment_amount.bedrag < 0:
            raise ValueError("Investeringsbedrag mag niet negatief zijn")
        
        annual_cost = investment_amount * float(self.ter.value)
        return annual_cost

    @property
    def is_cheap(self) -> bool:
        """Bepaal of dit ETF 'goedkoop' is (TER < 0.25%)."""
        return self.ter.value < 0.0025

    @property
    def age_years(self) -> Optional[int]:
        """Bereken hoe oud het ETF is in jaren (vanaf inception_date)."""
        if not self.inception_date:
            return None
        today = date.today()
        return today.year - self.inception_date.year

    def __str__(self) -> str:
        """String representatie: naam en ISIN."""
        return f"{self.name} ({self.isin})"

    def __hash__(self) -> int:
        """Hash gebaseerd op ISIN (unieke identifier)."""
        return hash(self.isin.code)

    def __eq__(self, other: object) -> bool:
        """Equality gebaseerd op ISIN."""
        if not isinstance(other, ETFProduct):
            return False
        return self.isin.code == other.isin.code

