"""Portfolio service — business logic voor portefeuilleposities."""
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import PortfolioPosition
from ..schemas import PortfolioPositionCreate

# ─── Regio- en TER-mapping voor bekende ETFs ─────────────────────────────────

_TICKER_REGION: dict[str, str] = {
    "IWDA": "Noord-Amerika",
    "VWCE": "Wereld",
    "VWRL": "Wereld",
    "SXR8": "Noord-Amerika",
    "EMIM": "Azië",
    "IMEU": "Europa",
    "AGGH": "Wereld",
    "EUN5": "Europa",
    "VAGF": "Wereld",
    "XDWD": "Noord-Amerika",
}

# TER als decimale breuk (0.0020 = 0,20 %/jaar)
_TICKER_TER: dict[str, float] = {
    "IWDA": 0.0020,
    "VWCE": 0.0022,
    "VWRL": 0.0022,
    "SXR8": 0.0007,
    "EMIM": 0.0018,
    "IMEU": 0.0012,
    "AGGH": 0.0010,
    "EUN5": 0.0015,
    "VAGF": 0.0010,
    "XDWD": 0.0019,
}

# Mock-koersen voor waardering (gelijk aan frontend)
_TICKER_PRICE: dict[str, float] = {
    "IWDA": 89.42,
    "VWCE": 115.30,
    "VWRL": 112.80,
    "SXR8": 544.20,
    "EMIM": 32.15,
    "IMEU": 28.90,
    "AGGH": 4.82,
    "EUN5": 161.30,
    "VAGF": 52.10,
    "XDWD": 87.65,
}


async def get_positions(db: AsyncSession, user_id: str) -> list[PortfolioPosition]:
    """Haal alle portefeuilleposities op voor een gebruiker.

    Args:
        db: Async database sessie.
        user_id: UUID van de gebruiker.

    Returns:
        Lijst van PortfolioPosition objecten, gesorteerd op aankoopdatum (nieuwste eerst).
    """
    result = await db.execute(
        select(PortfolioPosition)
        .where(PortfolioPosition.user_id == user_id)
        .order_by(PortfolioPosition.buy_date.desc())
    )
    return list(result.scalars().all())


async def add_position(
    db: AsyncSession, user_id: str, data: PortfolioPositionCreate
) -> PortfolioPosition:
    """Voeg een nieuwe positie toe aan de portefeuille.

    Args:
        db: Async database sessie.
        user_id: UUID van de gebruiker.
        data: Validated PortfolioPositionCreate schema.

    Returns:
        De aangemaakte PortfolioPosition.
    """
    position = PortfolioPosition(
        id=uuid.uuid4(),
        user_id=user_id,
        etf_isin=data.etf_isin,
        etf_ticker=data.etf_ticker,
        shares=data.shares,
        buy_price_eur=data.buy_price_eur,
        buy_date=data.buy_date,
        notes=data.notes,
    )
    db.add(position)
    await db.commit()
    await db.refresh(position)
    return position


async def delete_position(
    db: AsyncSession, user_id: str, position_id: uuid.UUID
) -> bool:
    """Verwijder een positie uit de portefeuille.

    Args:
        db: Async database sessie.
        user_id: UUID van de gebruiker.
        position_id: UUID van de positie.

    Returns:
        True als verwijderd, False als niet gevonden.
    """
    position = await db.scalar(
        select(PortfolioPosition).where(
            PortfolioPosition.id == position_id,
            PortfolioPosition.user_id == user_id,
        )
    )
    if not position:
        return False

    await db.delete(position)
    await db.commit()
    return True


def analyze_portfolio_risk(positions: list[PortfolioPosition]) -> dict[str, Any]:
    """Analyseer het risico en de diversificatie van een portefeuille.

    Berekent een risicoscore (1 = laagste risico/beste spreiding, 10 = hoogste),
    gewogen gemiddelde TER, geografische spreiding en concrete aanbevelingen.

    Args:
        positions: Lijst van PortfolioPosition objecten.

    Returns:
        Dict met score, score_label, ter_gewogen, geografisch, aanbevelingen en
        risico_niveau.
    """
    if not positions:
        return {
            "score": 5,
            "score_label": "Geen posities om te analyseren",
            "ter_gewogen": 0.0,
            "geografisch": {},
            "aanbevelingen": ["Voeg posities toe om de risicoscan te starten."],
            "risico_niveau": "medium",
        }

    # Huidige waarde per positie
    waarden: list[tuple[PortfolioPosition, float]] = []
    for pos in positions:
        prijs = _TICKER_PRICE.get(pos.etf_ticker, float(pos.buy_price_eur))
        waarden.append((pos, float(pos.shares) * prijs))

    totaal = sum(w for _, w in waarden)

    # Gewogen gemiddelde TER (als percentage)
    ter_gewogen_decimaal = 0.0
    if totaal > 0:
        for pos, waarde in waarden:
            ter = _TICKER_TER.get(pos.etf_ticker, 0.0025)
            ter_gewogen_decimaal += ter * (waarde / totaal)
    ter_pct = ter_gewogen_decimaal * 100  # naar percentage, bv. 0.22

    # Geografische spreiding (%)
    geo: dict[str, float] = {}
    for pos, waarde in waarden:
        regio = _TICKER_REGION.get(pos.etf_ticker, "Overig")
        geo[regio] = geo.get(regio, 0.0) + (waarde / totaal * 100 if totaal > 0 else 0.0)
    geo_pct: dict[str, int] = {k: round(v) for k, v in geo.items()}

    # Concentratie: maximaal gewicht van één ticker
    max_gewicht = max(w / totaal for _, w in waarden) if totaal > 0 else 1.0

    # ─── Risicoscore berekening (5 = neutraal) ───────────────────────────────
    score = 5

    # Concentratiestraf
    if max_gewicht > 0.80:
        score += 3
    elif max_gewicht > 0.60:
        score += 2
    elif max_gewicht > 0.40:
        score += 1

    # Regiobonus
    aantal_regios = len(geo)
    if aantal_regios >= 3:
        score -= 2
    elif aantal_regios >= 2:
        score -= 1

    # TER-bonus/-straf
    if ter_pct < 0.15:
        score -= 2
    elif ter_pct < 0.25:
        score -= 1
    elif ter_pct > 0.40:
        score += 1

    score = max(1, min(10, score))

    # Labels
    if score <= 3:
        label = "Goed gespreide portefeuille"
        risico_niveau = "laag"
    elif score <= 6:
        label = "Gemiddeld gespreide portefeuille"
        risico_niveau = "medium"
    else:
        label = "Geconcentreerde portefeuille"
        risico_niveau = "hoog"

    # Aanbevelingen
    aanbevelingen: list[str] = []

    if max_gewicht > 0.60:
        zwaarste = max(waarden, key=lambda x: x[1])[0].etf_ticker
        aanbevelingen.append(
            f"{zwaarste} maakt meer dan 60% van je portefeuille uit — overweeg meer spreiding."
        )

    if "Europa" not in geo:
        aanbevelingen.append(
            "Overweeg Europese blootstelling toe te voegen (bijv. IMEU) voor betere regiospreiding."
        )

    if ter_pct < 0.25:
        aanbevelingen.append(
            "Je gewogen TER is laag — uitstekend! Dit bespaart kosten op de lange termijn."
        )
    elif ter_pct > 0.40:
        aanbevelingen.append(
            "Je gewogen TER is relatief hoog. Overweeg goedkopere ETF-alternatieven."
        )

    if aantal_regios >= 2 and max_gewicht <= 0.60:
        aanbevelingen.append(
            "Je portfolio heeft al meerdere regio's — dat is een goede basis voor spreiding."
        )

    if not aanbevelingen:
        aanbevelingen.append(
            "Portefeuille ziet er evenwichtig uit. Blijf gespreid en houd de kosten laag."
        )

    return {
        "score": score,
        "score_label": label,
        "ter_gewogen": round(ter_pct, 4),
        "geografisch": geo_pct,
        "aanbevelingen": aanbevelingen,
        "risico_niveau": risico_niveau,
    }
