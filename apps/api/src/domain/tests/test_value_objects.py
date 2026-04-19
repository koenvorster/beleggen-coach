"""Unit tests voor domain value objects."""
import pytest
from decimal import Decimal

from ..value_objects import Geld, BeleggingsProfiel, ISIN, ETFTicker


def test_geld_optelling():
    a = Geld(bedrag=Decimal("100.00"))
    b = Geld(bedrag=Decimal("50.50"))
    assert (a + b).bedrag == Decimal("150.50")


def test_geld_afronding():
    g = Geld(bedrag=Decimal("100.005"))
    assert g.bedrag == Decimal("100.01")  # HALF_UP


def test_geld_valuta_mismatch():
    eur = Geld(bedrag=Decimal("100"), valuta="EUR")
    usd = Geld(bedrag=Decimal("100"), valuta="USD")
    with pytest.raises(ValueError):
        _ = eur + usd


def test_beleggingsprofiel_horizon_categorie():
    profiel = BeleggingsProfiel(
        risico="hoog",
        horizon_jaren=20,
        maandbudget=Geld(bedrag=Decimal("200")),
    )
    assert profiel.horizon_categorie == "lang"
    assert profiel.is_geschikt_voor_aandelen is True


def test_beleggingsprofiel_kort_horizon_niet_geschikt_voor_aandelen():
    profiel = BeleggingsProfiel(
        risico="hoog",
        horizon_jaren=3,
        maandbudget=Geld(bedrag=Decimal("100")),
    )
    assert profiel.is_geschikt_voor_aandelen is False


def test_isin_validatie():
    isin = ISIN(code="IE00B4L5Y983")
    assert str(isin) == "IE00B4L5Y983"


def test_isin_te_kort():
    with pytest.raises(ValueError):
        ISIN(code="IE00B4L5")


def test_isin_lowercase_wordt_uppercase():
    isin = ISIN(code="ie00b4l5y983")
    assert isin.code == "IE00B4L5Y983"


def test_geprojecteerde_waarde():
    profiel = BeleggingsProfiel(
        risico="matig",
        horizon_jaren=10,
        maandbudget=Geld(bedrag=Decimal("200")),
    )
    waarde = profiel.geprojecteerde_waarde(0.06)
    # €200/maand, 10 jaar, 6% → circa €32.776
    assert waarde.bedrag > Decimal("30000")
    assert waarde.bedrag < Decimal("40000")
