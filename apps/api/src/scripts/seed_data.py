"""Seed-data voor lokale ontwikkeling.

Gebruik:
    uv run python -m src.scripts.seed_data

Voegt demo-ETFs en een demo-gebruikersprofiel in.
Veilig om meerdere keren uit te voeren (upsert).
"""
import asyncio
import uuid

from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert as pg_insert

from src.database import AsyncSessionLocal
from src.models import ETF, User, InvestorProfile

DEV_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000000")

SEED_ETFS = [
    # ── Bestaande entries (gefixed) ──────────────────────────────────────────
    {
        # Distributing versie — is_accumulating gecorrigeerd naar False
        "isin": "IE00B3RBWM25",
        "name": "Vanguard FTSE All-World UCITS ETF Dist",
        "category": "Wereldwijd aandelen",
        "ter": 0.0022,
        "risk_level": 4,
        "currency": "EUR",
        "fund_size_m": 18500.0,
        "is_accumulating": False,
        "replication_method": "physical",
        "domicile": "IE",
        "description": "Breed gespreide wereldwijde ETF met kwartaaldividend, ideaal voor beginners",
    },
    {
        "isin": "IE00B4L5Y983",
        "name": "iShares Core MSCI World UCITS ETF Acc",
        "category": "Ontwikkelde markten",
        "ter": 0.0020,
        "risk_level": 4,
        "currency": "EUR",
        "fund_size_m": 72000.0,
        "is_accumulating": True,
        "replication_method": "physical",
        "domicile": "IE",
        "description": "Grote, goedkope ETF voor ontwikkelde markten — dekt geen opkomende markten",
    },
    {
        "isin": "IE00BDBRDM35",
        "name": "Vanguard ESG Global All Cap UCITS ETF Acc",
        "category": "ESG/Duurzaam",
        "ter": 0.0024,
        "risk_level": 4,
        "currency": "EUR",
        "fund_size_m": 3200.0,
        "is_accumulating": True,
        "replication_method": "physical",
        "domicile": "IE",
        "description": "Duurzame wereldwijde ETF met ESG-screening, inclusief small caps",
    },
    {
        # ISIN gecorrigeerd: was IE00B3F81R35 (IMEU-ISIN), nu correct als IMEU-entry
        "isin": "IE00B3F81R35",
        "name": "iShares Core MSCI Europe UCITS ETF Acc",
        "category": "Europese aandelen",
        "ter": 0.0012,
        "risk_level": 4,
        "currency": "EUR",
        "fund_size_m": 7500.0,
        "is_accumulating": True,
        "replication_method": "physical",
        "domicile": "IE",
        "description": "Breed gespreide ETF voor Europese aandelen uit ontwikkelde markten",
    },
    {
        "isin": "IE00B14X4S71",
        "name": "iShares MSCI EM UCITS ETF Acc",
        "category": "Opkomende markten",
        "ter": 0.0018,
        "risk_level": 5,
        "currency": "EUR",
        "fund_size_m": 6800.0,
        "is_accumulating": True,
        "replication_method": "physical",
        "domicile": "IE",
        "description": "Opkomende markten ETF (zonder small caps), hoger risico en groeipotentieel",
    },
    # ── Nieuwe entries ───────────────────────────────────────────────────────
    {
        "isin": "IE00BK5BQT80",
        "name": "Vanguard FTSE All-World UCITS ETF Acc",
        "category": "Wereldwijd aandelen",
        "ter": 0.0022,
        "risk_level": 4,
        "currency": "EUR",
        "fund_size_m": 22000.0,
        "is_accumulating": True,
        "replication_method": "physical",
        "domicile": "IE",
        "description": "Accumulerende versie van VWRL — 3700+ holdings wereldwijd inclusief EM",
    },
    {
        "isin": "IE00B5BMR087",
        "name": "iShares Core S&P 500 UCITS ETF Acc",
        "category": "Amerikaanse aandelen",
        "ter": 0.0007,
        "risk_level": 4,
        "currency": "EUR",
        "fund_size_m": 75000.0,
        "is_accumulating": True,
        "replication_method": "physical",
        "domicile": "IE",
        "description": "Volgt de 500 grootste Amerikaanse bedrijven, zeer lage kosten",
    },
    {
        "isin": "IE00B4WXJJ64",
        "name": "iShares Core MSCI EM IMI UCITS ETF Acc",
        "category": "Opkomende markten",
        "ter": 0.0018,
        "risk_level": 5,
        "currency": "EUR",
        "fund_size_m": 19000.0,
        "is_accumulating": True,
        "replication_method": "physical",
        "domicile": "IE",
        "description": "Opkomende markten inclusief small caps (IMI), 3200+ holdings",
    },
    {
        "isin": "IE00BMVB5P51",
        "name": "Vanguard LifeStrategy 80% Equity UCITS ETF Acc",
        "category": "Gemengd",
        "ter": 0.0025,
        "risk_level": 4,
        "currency": "EUR",
        "fund_size_m": 1800.0,
        "is_accumulating": True,
        "replication_method": "physical",
        "domicile": "IE",
        "description": "80% aandelen / 20% obligaties — all-in-one voor beleggers met hogere risicotolerantie",
    },
    {
        "isin": "IE00BMVB5K07",
        "name": "Vanguard LifeStrategy 60% Equity UCITS ETF Acc",
        "category": "Gemengd",
        "ter": 0.0025,
        "risk_level": 3,
        "currency": "EUR",
        "fund_size_m": 1200.0,
        "is_accumulating": True,
        "replication_method": "physical",
        "domicile": "IE",
        "description": "60% aandelen / 40% obligaties — uitgebalanceerde all-in-one ETF voor beginners",
    },
    {
        "isin": "IE00BF4RFH31",
        "name": "iShares MSCI World Small Cap UCITS ETF Acc",
        "category": "Wereldwijd small cap",
        "ter": 0.0035,
        "risk_level": 5,
        "currency": "EUR",
        "fund_size_m": 4500.0,
        "is_accumulating": True,
        "replication_method": "physical",
        "domicile": "IE",
        "description": "Kleine bedrijven wereldwijd — hogere volatiliteit, potentieel extra rendement",
    },
    {
        "isin": "IE00B3F81409",
        "name": "iShares Core Global Aggregate Bond UCITS ETF Acc",
        "category": "Obligaties",
        "ter": 0.0010,
        "risk_level": 2,
        "currency": "EUR",
        "fund_size_m": 12000.0,
        "is_accumulating": True,
        "replication_method": "sampled",
        "domicile": "IE",
        "description": "Wereldwijde obligaties, geschikt als stabilisator in een portefeuille",
    },
    {
        "isin": "IE00BFY0GT14",
        "name": "SPDR MSCI World UCITS ETF Acc",
        "category": "Ontwikkelde markten",
        "ter": 0.0012,
        "risk_level": 4,
        "currency": "EUR",
        "fund_size_m": 5000.0,
        "is_accumulating": True,
        "replication_method": "physical",
        "domicile": "IE",
        "description": "Goedkope MSCI World ETF van State Street, fysiek gerepliceerd",
    },
    {
        "isin": "IE00B3XXRP09",
        "name": "Vanguard S&P 500 UCITS ETF Acc",
        "category": "Amerikaanse aandelen",
        "ter": 0.0007,
        "risk_level": 4,
        "currency": "EUR",
        "fund_size_m": 35000.0,
        "is_accumulating": True,
        "replication_method": "physical",
        "domicile": "IE",
        "description": "Accumulerende Vanguard S&P 500 ETF, identieke kosten als SXR8",
    },
    {
        "isin": "LU0274208692",
        "name": "Xtrackers MSCI World Swap UCITS ETF Acc",
        "category": "Ontwikkelde markten",
        "ter": 0.0019,
        "risk_level": 4,
        "currency": "EUR",
        "fund_size_m": 8000.0,
        "is_accumulating": True,
        "replication_method": "synthetic",
        "domicile": "LU",
        "description": "Synthetische MSCI World ETF — iets lagere TER, tegenpartijrisico via swap",
    },
]


async def seed_etfs(session) -> None:
    """Voeg demo-ETFs in via upsert op ISIN."""
    for etf_data in SEED_ETFS:
        stmt = (
            pg_insert(ETF)
            .values(**etf_data)
            .on_conflict_do_update(
                index_elements=["isin"],
                set_={k: v for k, v in etf_data.items() if k != "isin"},
            )
        )
        await session.execute(stmt)
    print(f"  ✓ {len(SEED_ETFS)} ETFs ingevoegd/bijgewerkt")


async def seed_demo_user(session) -> None:
    """Voeg demo-gebruiker en profiel in via upsert."""
    user_data = {
        "id": DEV_USER_ID,
        "email": "dev@example.com",
        "naam": "Demo Gebruiker",
        "taal": "nl",
        "keycloak_user_id": "00000000-0000-0000-0000-000000000000",
    }
    user_stmt = (
        pg_insert(User)
        .values(**user_data)
        .on_conflict_do_update(
            index_elements=["id"],
            set_={k: v for k, v in user_data.items() if k != "id"},
        )
    )
    await session.execute(user_stmt)
    print("  ✓ Demo-gebruiker ingevoegd/bijgewerkt (dev@example.com)")

    profile_data = {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000001"),
        "user_id": DEV_USER_ID,
        "goal_type": "pensioen",
        "goal_description": "Sparen voor een comfortabel pensioen op lange termijn",
        "horizon_years": 25,
        "monthly_budget": 200.00,
        "emergency_fund_ready": False,
        "risk_tolerance": "gemiddeld",
        "experience_level": "beginner",
    }
    profile_stmt = (
        pg_insert(InvestorProfile)
        .values(**profile_data)
        .on_conflict_do_update(
            index_elements=["id"],
            set_={k: v for k, v in profile_data.items() if k not in ("id", "user_id")},
        )
    )
    await session.execute(profile_stmt)
    print("  ✓ Demo-profiel ingevoegd/bijgewerkt (pensioen, 25 jaar, €200/maand)")


async def main() -> None:
    """Voer alle seed-stappen uit."""
    print("🌱 Seed-data invoegen...")
    async with AsyncSessionLocal() as session:
        async with session.begin():
            await seed_etfs(session)
            await seed_demo_user(session)
    print("✅ Seed-data succesvol ingevoegd.")


if __name__ == "__main__":
    asyncio.run(main())
