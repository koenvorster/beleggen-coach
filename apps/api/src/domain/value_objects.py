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


class ISIN(BaseModel):
    """Value Object voor een ISIN-code (International Securities Identification Number)."""
    code: str

    model_config = {"frozen": True}

    @field_validator("code")
    @classmethod
    def valideer_isin(cls, v: str) -> str:
        v = v.strip().upper()
        if len(v) != 12:
            raise ValueError(f"ISIN moet 12 tekens zijn, kreeg {len(v)}: '{v}'")
        if not v[:2].isalpha():
            raise ValueError(f"ISIN moet beginnen met 2 letters (landcode): '{v}'")
        if not v[2:].isalnum():
            raise ValueError(f"ISIN tekens 3-12 moeten alfanumeriek zijn: '{v}'")
        return v

    def __str__(self) -> str:
        return self.code


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
