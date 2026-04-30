"""Domain Value Objects — immutable, vergelijkbaar op waarde."""
from __future__ import annotations
from decimal import Decimal, ROUND_HALF_UP
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class Geld(BaseModel):
    """Geldbedrag in EUR, altijd positief, 2 decimalen."""
    bedrag: Decimal = Field(..., ge=Decimal("0"))
    valuta: str = "EUR"

    model_config = {"frozen": True}

    @field_validator("bedrag", mode="before")
    @classmethod
    def rond_af(cls, v: object) -> Decimal:
        """Rond af op 2 decimalen (HALF_UP)."""
        return Decimal(str(v)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def __add__(self, other: "Geld") -> "Geld":
        if self.valuta != other.valuta:
            raise ValueError(f"Kan {self.valuta} niet optellen bij {other.valuta}")
        return Geld(bedrag=self.bedrag + other.bedrag, valuta=self.valuta)

    def __mul__(self, factor: float | int | Decimal) -> "Geld":
        return Geld(bedrag=self.bedrag * Decimal(str(factor)), valuta=self.valuta)

    def __str__(self) -> str:
        return f"€ {self.bedrag:.2f}"


# ─── NEW: ETF-specific Value Objects ──────────────────────────────────────────


class ISIN(BaseModel):
    """Value Object voor ISIN (International Securities Identification Number).
    
    Immutable, alfanumeriek, 12 tekens: 2 letters (landcode) + 10 alfanumerieke.
    Bijv. IE00B4L5Y983
    """
    code: str

    model_config = {"frozen": True}

    @field_validator("code")
    @classmethod
    def validate_isin(cls, v: str) -> str:
        """Valideer ISIN formaat."""
        v = v.strip().upper()
        if len(v) != 12:
            raise ValueError(f"ISIN moet 12 tekens zijn, kreeg {len(v)}: '{v}'")
        if not v[:2].isalpha():
            raise ValueError(f"ISIN moet beginnen met 2 letters: '{v}'")
        if not v[2:].isalnum():
            raise ValueError(f"ISIN tekens 3-12 moeten alfanumeriek zijn: '{v}'")
        return v

    def __str__(self) -> str:
        return self.code

    def __hash__(self) -> int:
        return hash(self.code)


class TER(BaseModel):
    """Value Object voor Total Expense Ratio (jaarlijkse kosten als percentage).
    
    Immutable, decimaal tussen 0.0 en 1.0 (0% tot 100%).
    Bijv. 0.0020 = 0.20%
    """
    value: Decimal = Field(..., ge=Decimal("0"), le=Decimal("1"))

    model_config = {"frozen": True}

    @field_validator("value", mode="before")
    @classmethod
    def normalize_ter(cls, v: object) -> Decimal:
        """Zet om naar Decimal met 4 decimalen."""
        result = Decimal(str(v))
        if result < 0 or result > 1:
            raise ValueError(f"TER moet tussen 0.0 en 1.0 liggen, kreeg {result}")
        return result.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)

    def __str__(self) -> str:
        """Geef TER als percentage (bijv. '0.20%' voor 0.002)."""
        percentage = self.value * 100
        return f"{percentage:.2f}%"

    def __float__(self) -> float:
        return float(self.value)


class ETFScore(BaseModel):
    """Value Object voor risicoscore van een ETF.
    
    Immutable, range 1-7 met beschrijvend label.
    1 = Conservative, 4 = Moderate, 7 = Aggressive
    """
    level: int = Field(..., ge=1, le=7)
    label: str

    model_config = {"frozen": True}

    @field_validator("label", mode="before")
    @classmethod
    def validate_label(cls, v: str) -> str:
        """Valideer label is niet leeg."""
        if not v or not v.strip():
            raise ValueError("Label mag niet leeg zijn")
        return v.strip()

    @classmethod
    def from_level(cls, level: int) -> "ETFScore":
        """Factory method: create ETFScore van risk level (1-7)."""
        labels = {
            1: "Conservative",
            2: "Conservative-Moderate",
            3: "Moderate",
            4: "Moderate",
            5: "Moderate-Aggressive",
            6: "Aggressive",
            7: "Very Aggressive",
        }
        if level < 1 or level > 7:
            raise ValueError(f"Risk level moet 1-7 zijn, kreeg {level}")
        return cls(level=level, label=labels[level])

    def __str__(self) -> str:
        return f"Level {self.level} ({self.label})"


class DividendYield(BaseModel):
    """Value Object voor dividend yield als percentage.
    
    Immutable, decimaal tussen 0.0 en 100.0
    Bijv. 2.5 = 2.5% jaarlijkse dividenduitkering
    """
    value: Decimal = Field(..., ge=Decimal("0"), le=Decimal("100"))

    model_config = {"frozen": True}

    @field_validator("value", mode="before")
    @classmethod
    def normalize_yield(cls, v: object) -> Decimal:
        """Zet om naar Decimal met 2 decimalen."""
        result = Decimal(str(v))
        return result.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def __str__(self) -> str:
        return f"{self.value}%"

    def __float__(self) -> float:
        return float(self.value)


RisicoNiveau = Literal["laag", "matig", "hoog"]
Horizon = Literal["kort", "middel", "lang"]  # <5j, 5-15j, >15j


class BeleggingsProfiel(BaseModel):
    """Value Object dat het risico-/horizonprofiel van een belegger beschrijft."""
    risico: RisicoNiveau
    horizon_jaren: int = Field(..., ge=1, le=40)
    maandbudget: Geld

    model_config = {"frozen": True}

    @property
    def horizon_categorie(self) -> Horizon:
        if self.horizon_jaren < 5:
            return "kort"
        if self.horizon_jaren <= 15:
            return "middel"
        return "lang"

    @property
    def is_geschikt_voor_aandelen(self) -> bool:
        """Aandelen-ETFs zijn geschikt bij matig/hoog risico EN horizon >= 5 jaar."""
        return self.risico in ("matig", "hoog") and self.horizon_jaren >= 5

    def geprojecteerde_waarde(self, jaarlijks_rendement: float = 0.06) -> Geld:
        """Bereken de verwachte eindwaarde via maandelijkse inleg (compound interest).

        Args:
            jaarlijks_rendement: Jaarlijks rendement als decimaal (standaard 6%).

        Returns:
            Geprojecteerde eindwaarde als Geld value object.
        """
        r = Decimal(str(jaarlijks_rendement)) / 12
        n = self.horizon_jaren * 12
        maand = self.maandbudget.bedrag
        if r == 0:
            waarde = maand * n
        else:
            waarde = maand * ((((1 + r) ** n) - 1) / r)
        return Geld(bedrag=waarde)


class ETFTicker(BaseModel):
    """Value Object voor een beurs-ticker (bijv. 'IWDA.AS')."""
    waarde: str

    model_config = {"frozen": True}

    @field_validator("waarde")
    @classmethod
    def valideer_ticker(cls, v: str) -> str:
        v = v.strip().upper()
        if not v or len(v) > 20:
            raise ValueError(f"Ongeldige ticker: '{v}'")
        return v

    def __str__(self) -> str:
        return self.waarde
