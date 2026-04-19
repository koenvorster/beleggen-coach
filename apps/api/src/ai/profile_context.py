"""Profielcontext voor AI chat — injecteer investeerdersprofiel en top-3 ETFs."""
from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..data.etf_catalog import ETF_CATALOG, ETFEntry
from ..models import InvestorProfile

logger = logging.getLogger(__name__)

# ─── Mappings ────────────────────────────────────────────────────────────────

RISK_TOLERANCE_TO_LEVEL: dict[str, int] = {
    "laag": 2,
    "matig": 4,
    "hoog": 6,
}

RISK_LEVEL_LABELS: dict[int, str] = {
    1: "zeer defensief",
    2: "defensief",
    3: "licht defensief",
    4: "gematigd",
    5: "licht offensief",
    6: "offensief",
    7: "agressief",
}

GOAL_TYPE_LABELS: dict[str, str] = {
    "pensioen": "pensioen opbouwen",
    "huis_kopen": "een huis kopen",
    "studie_kind": "studie van een kind betalen",
    "noodfonds": "een noodfonds opbouwen",
    "vermogen_opbouwen": "vermogen opbouwen",
    "anders": "een persoonlijk doel",
}

# ─── Dataclass ───────────────────────────────────────────────────────────────


@dataclass
class ProfileContext:
    """Geaggregeerde context voor het bouwen van de AI system prompt."""

    goal: str
    monthly_budget: float
    horizon_years: int
    risk_tolerance: str
    risk_level: int
    top3: list[dict[str, Any]] = field(default_factory=list)


DEFAULT_PROFILE_CONTEXT = ProfileContext(
    goal="sparen voor de toekomst",
    monthly_budget=100.0,
    horizon_years=10,
    risk_tolerance="matig",
    risk_level=4,
    top3=[],
)

# ─── System prompt template ──────────────────────────────────────────────────

SYSTEM_PROMPT_TEMPLATE = """Je bent BeleggenCoach, een vriendelijke AI-beleggingsassistent voor Belgische beginners.
Je geeft GEEN financieel advies. Je helpt mensen leren over beleggen.

Gebruikersprofiel:
- Doel: {goal}
- Maandelijks budget: €{monthly}/maand
- Beleggingshorizon: {years} jaar
- Risicoprofiel: {risk} (niveau {risk_level}/7)

Aanbevolen ETFs voor dit profiel:
{etf_context}

Regels:
- Spreek in begrijpelijk Nederlands, geen jargon
- Zeg nooit "koop" of "investeer nu" — gebruik "kan passen bij jouw profiel omdat..."
- Verwijs bij twijfel naar een erkende financieel adviseur
- Houd antwoorden kort en praktisch (max 3 alinea's)
- Dit is educatieve informatie, geen beleggingsadvies
"""

# ─── ETF scoring ─────────────────────────────────────────────────────────────


def _infer_etf_risk_level(etf: ETFEntry) -> int:
    """Leid een risicoscore (1-7) af uit de ETF-categorie en regio.

    De API-catalogus heeft geen volatiliteitsdata, dus we schatten op basis
    van categorie (aandelen/obligaties) en regionale blootstelling.

    Args:
        etf: ETF-entry uit de API-catalogus.

    Returns:
        Risicoscore tussen 1 (zeer laag) en 7 (zeer hoog).
    """
    categorie = etf["categorie"]
    regio = etf.get("regio", "World")

    if categorie == "obligaties":
        return 2
    if categorie == "gemengd":
        return 3
    # aandelen: verfijn op regio
    if "opkomende" in regio.lower() or "emerging" in regio.lower():
        return 6
    if regio in ("USA",):
        return 5
    if regio in ("Europa", "Europe"):
        return 4
    return 4  # World / overig


def _score_etf_for_profile(
    etf: ETFEntry,
    risk_level: int,
    horizon_years: int,
) -> tuple[float, str]:
    """Bereken een profielscore (0-100) en Nederlandse uitleg voor een ETF.

    Scoring breakdown:
    - Risk match   (40 pts): verschil per niveau kost 8 punten.
    - TER          (20 pts): lager is beter.
    - Horizon fit  (20 pts): aandelen passen bij lange horizon.
    - Spreiding    (20 pts): meer holdings = meer diversificatie.

    Args:
        etf: ETF-entry uit de API-catalogus.
        risk_level: Risicoscore van de gebruiker (1-7).
        horizon_years: Beleggingshorizon van de gebruiker in jaren.

    Returns:
        Tuple van (totaalscore 0-100, Nederlandse uitleg string).
    """
    reasons: list[str] = []

    # Risk match (40 pts)
    etf_risk = _infer_etf_risk_level(etf)
    diff = abs(etf_risk - risk_level)
    risk_score = max(0, 40 - diff * 8)
    if diff == 0:
        reasons.append(f"risiconiveau ({etf_risk}/7) perfect aansluit bij jouw profiel")
    elif diff <= 1:
        reasons.append(f"risiconiveau ({etf_risk}/7) dicht bij jouw profiel (niveau {risk_level}) ligt")
    else:
        reasons.append(f"risiconiveau ({etf_risk}/7) enigszins afwijkt van jouw profiel (niveau {risk_level})")

    # TER (20 pts)
    ter = etf["expense_ratio"]
    if ter < 0.10:
        ter_score = 20
        reasons.append(f"kosten uitzonderlijk laag zijn ({ter:.2f}%/jaar)")
    elif ter < 0.20:
        ter_score = 15
        reasons.append(f"kosten laag zijn ({ter:.2f}%/jaar)")
    elif ter < 0.30:
        ter_score = 10
        reasons.append(f"kosten redelijk zijn ({ter:.2f}%/jaar)")
    else:
        ter_score = 5
        reasons.append(f"kosten relatief hoog zijn ({ter:.2f}%/jaar)")

    # Horizon fit (20 pts)
    cat = etf["categorie"]
    if cat == "aandelen":
        if horizon_years > 10:
            horizon_score = 20
            reasons.append(f"de lange horizon van {horizon_years} jaar goed past bij aandelen")
        elif horizon_years >= 5:
            horizon_score = 12
            reasons.append(f"de horizon van {horizon_years} jaar redelijk is voor aandelen")
        else:
            horizon_score = 4
            reasons.append(f"de korte horizon van {horizon_years} jaar aandelen iets risicovoller maakt")
    elif cat == "obligaties":
        if horizon_years > 10:
            horizon_score = 8
            reasons.append(f"obligaties minder optimaal zijn voor een horizon van {horizon_years} jaar")
        elif horizon_years >= 5:
            horizon_score = 16
            reasons.append(f"de horizon van {horizon_years} jaar goed aansluit bij obligaties")
        else:
            horizon_score = 20
            reasons.append(f"de korte horizon van {horizon_years} jaar uitstekend past bij obligaties")
    else:
        horizon_score = 14
        reasons.append(f"dit fonds flexibel is voor een horizon van {horizon_years} jaar")

    # Spreiding (20 pts)
    holdings = etf.get("holdings", 100)
    if holdings >= 1000:
        spread_score = 20
        reasons.append(f"brede spreiding over {holdings:,} posities")
    elif holdings >= 400:
        spread_score = 14
        reasons.append(f"goede spreiding over {holdings} posities")
    elif holdings >= 100:
        spread_score = 8
        reasons.append(f"matige spreiding over {holdings} posities")
    else:
        spread_score = 4
        reasons.append(f"beperkte spreiding over {holdings} posities")

    total = float(risk_score + ter_score + horizon_score + spread_score)

    if len(reasons) > 1:
        reden_body = ", ".join(reasons[:-1]) + " en " + reasons[-1]
    else:
        reden_body = reasons[0] if reasons else "aansluit bij de opgegeven criteria"

    reden = (
        f"Past mogelijk bij jouw profiel (niveau {risk_level}) omdat {reden_body}. "
        f"Kosten: {ter:.2f}%/jaar."
    )
    return total, reden


def get_top3_etfs_for_profile(risk_level: int, horizon_years: int) -> list[dict[str, Any]]:
    """Geef de top 3 ETFs voor een investeerdersprofiel op basis van scoring.

    Scores elke ETF in de API-catalogus en geeft de drie hoogst scorende terug.

    Args:
        risk_level: Risicoscore van de gebruiker (1-7).
        horizon_years: Beleggingshorizon van de gebruiker in jaren.

    Returns:
        Lijst van max 3 dicts met rank, ticker, naam, score, expense_ratio en reden.
    """
    scored: list[tuple[ETFEntry, float, str]] = []
    for etf in ETF_CATALOG:
        score, reden = _score_etf_for_profile(etf, risk_level, horizon_years)
        scored.append((etf, score, reden))

    scored.sort(key=lambda x: x[1], reverse=True)

    return [
        {
            "rank": rank,
            "ticker": etf["ticker"],
            "naam": etf["name"],
            "score": round(score, 1),
            "expense_ratio": etf["expense_ratio"],
            "reden": reden,
        }
        for rank, (etf, score, reden) in enumerate(scored[:3], start=1)
    ]


# ─── DB helpers ──────────────────────────────────────────────────────────────


async def load_profile_for_user(db: AsyncSession, user_id_str: str) -> ProfileContext:
    """Laad het investeerdersprofiel uit de DB voor de gegeven gebruikers-ID.

    Probeert user_id_str als UUID te parsen en zoekt het bijhorende InvestorProfile op.
    Als het profiel niet gevonden wordt of de ID ongeldig is, wordt het standaardprofiel
    gebruikt zodat de chatbot altijd een nuttige context heeft.

    Args:
        db: Async SQLAlchemy sessie.
        user_id_str: Gebruikers-ID als string (UUID of anonieme session-token).

    Returns:
        ProfileContext met profiel- en ETF-aanbevelingsdata.
    """
    profile: InvestorProfile | None = None
    try:
        user_uuid = uuid.UUID(user_id_str)
        profile = await db.scalar(
            select(InvestorProfile).where(InvestorProfile.user_id == user_uuid)
        )
    except (ValueError, AttributeError):
        # Ongeldige UUID (bijv. "anonymous") — stilzwijgend doorgaan
        pass
    except Exception as exc:
        logger.warning("Profiel ophalen mislukt (user=%s): %s", user_id_str, exc)

    if profile is None:
        logger.debug(
            "Geen profiel gevonden voor user=%s — standaard profiel gebruikt", user_id_str
        )
        return DEFAULT_PROFILE_CONTEXT

    risk_level = RISK_TOLERANCE_TO_LEVEL.get(profile.risk_tolerance, 4)
    top3 = get_top3_etfs_for_profile(risk_level, profile.horizon_years)
    goal_label = GOAL_TYPE_LABELS.get(profile.goal_type, profile.goal_type)

    return ProfileContext(
        goal=goal_label,
        monthly_budget=float(profile.monthly_budget),
        horizon_years=profile.horizon_years,
        risk_tolerance=profile.risk_tolerance,
        risk_level=risk_level,
        top3=top3,
    )


def build_system_prompt(ctx: ProfileContext) -> str:
    """Bouw een dynamische system prompt met profiel- en ETF-context.

    Args:
        ctx: ProfileContext met gebruikersprofiel en top-3 ETF-aanbevelingen.

    Returns:
        Volledig ingevulde system prompt string.
    """
    if ctx.top3:
        etf_lines: list[str] = []
        for etf in ctx.top3:
            etf_lines.append(
                f"{etf['rank']}. {etf['ticker']} — {etf['naam']} "
                f"(score: {etf['score']}/100, kosten: {etf['expense_ratio']:.2f}%/jaar)\n"
                f"   {etf['reden']}"
            )
        etf_context = "\n".join(etf_lines)
    else:
        etf_context = "Nog geen ETF-aanbevelingen beschikbaar."

    risk_label = RISK_LEVEL_LABELS.get(ctx.risk_level, str(ctx.risk_level))
    return SYSTEM_PROMPT_TEMPLATE.format(
        goal=ctx.goal,
        monthly=f"{ctx.monthly_budget:.0f}",
        years=ctx.horizon_years,
        risk=risk_label,
        risk_level=ctx.risk_level,
        etf_context=etf_context,
    )
