"""Tests voor de get_top3_for_profile tool in etf-data-mcp."""
import sys
import pathlib
import asyncio
import pytest

# Voeg de src-map van etf-data-mcp toe aan het pad zodat de module vindbaar is.
sys.path.insert(
    0,
    str(pathlib.Path(__file__).parent.parent / "etf-data-mcp" / "src"),
)

from etf_data_mcp.tools.etf_tools import handle_get_top3_for_profile  # noqa: E402


def run(coro):
    """Hulpfunctie om een coroutine synchroon uit te voeren in de tests."""
    return asyncio.get_event_loop().run_until_complete(coro)


class TestGetTop3ForProfile:
    """Tests voor het ophalen van de top-3 ETF-aanbevelingen voor een gebruikersprofiel."""

    def test_returns_three_etfs_for_valid_profile(self):
        """Geldige invoer levert exact drie ETF-resultaten op.

        Profiel: risicoscore 3 (licht defensief), horizon 20 jaar, inleg €200/maand.
        Verwacht: success=True en drie items in top3.
        """
        result = run(handle_get_top3_for_profile({
            "risk_level": 3,
            "horizon_years": 20,
            "monthly_investment": 200,
        }))

        assert result["success"] is True, f"Verwachtte success=True, maar kreeg: {result}"
        assert result["error"] is None
        top3 = result["data"]["top3"]
        assert len(top3) == 3, f"Verwachtte 3 ETFs, maar kreeg {len(top3)}"

        for rank, item in enumerate(top3, start=1):
            assert item["rank"] == rank
            assert "isin" in item
            assert "ticker" in item
            assert "naam" in item
            assert "score" in item
            assert "reden" in item
            assert "expense_ratio" in item
            assert "categorie" in item
            assert isinstance(item["score"], float)
            assert 0 <= item["score"] <= 100

        assert "profile_summary" in result["data"]
        assert "3" in result["data"]["profile_summary"] or "niveau" in result["data"]["profile_summary"]

    def test_invalid_risk_level_returns_error(self):
        """Een risicoscore buiten het bereik 1-7 levert een INVALID_INPUT fout op.

        Invoer: risk_level=10 (te hoog).
        Verwacht: success=False, error.code='INVALID_INPUT'.
        """
        result = run(handle_get_top3_for_profile({
            "risk_level": 10,
            "horizon_years": 10,
            "monthly_investment": 100,
        }))

        assert result["success"] is False
        assert result["data"] is None
        assert result["error"]["code"] == "INVALID_INPUT"
        assert result["error"]["message"]

    def test_invalid_missing_required_field_returns_error(self):
        """Ontbrekend verplicht veld levert een INVALID_INPUT fout op.

        Invoer: ontbrekende monthly_investment.
        Verwacht: success=False, error.code='INVALID_INPUT'.
        """
        result = run(handle_get_top3_for_profile({
            "risk_level": 4,
            "horizon_years": 10,
        }))

        assert result["success"] is False
        assert result["error"]["code"] == "INVALID_INPUT"

    def test_preferred_category_obligaties_returns_bond_etf_first(self):
        """Bij voorkeurscategorie 'obligaties' is het eerste resultaat een obligatie-ETF.

        Profiel: risicoscore 2, horizon 5 jaar, inleg €100/maand, categorie obligaties.
        Verwacht: het top-resultaat heeft categorie='obligaties'.
        """
        result = run(handle_get_top3_for_profile({
            "risk_level": 2,
            "horizon_years": 5,
            "monthly_investment": 100,
            "preferred_category": "obligaties",
        }))

        assert result["success"] is True
        top3 = result["data"]["top3"]
        assert len(top3) >= 1
        top_item = top3[0]
        assert top_item["categorie"] == "obligaties", (
            f"Verwachtte 'obligaties' als categorie voor de eerste aanbeveling, maar kreeg '{top_item['categorie']}'"
        )

    def test_reden_is_in_dutch_and_no_koop_language(self):
        """De 'reden' veld bevat Nederlandse tekst zonder 'koop'-taal.

        Verwacht: reden begint met 'Past mogelijk' en bevat geen 'koop'.
        """
        result = run(handle_get_top3_for_profile({
            "risk_level": 5,
            "horizon_years": 15,
            "monthly_investment": 300,
        }))

        assert result["success"] is True
        for item in result["data"]["top3"]:
            reden = item["reden"]
            assert "koop" not in reden.lower(), f"'reden' bevat 'koop'-taal: {reden}"
            assert "Past mogelijk" in reden, f"'reden' begint niet met 'Past mogelijk': {reden}"

    def test_scores_are_ranked_descending(self):
        """De top3 is gesorteerd van hoogste naar laagste score."""
        result = run(handle_get_top3_for_profile({
            "risk_level": 4,
            "horizon_years": 10,
            "monthly_investment": 150,
        }))

        assert result["success"] is True
        scores = [item["score"] for item in result["data"]["top3"]]
        assert scores == sorted(scores, reverse=True), f"Scores niet aflopend gesorteerd: {scores}"
