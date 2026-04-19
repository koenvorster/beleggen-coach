"""Tools voor investeerdersprofiel met volledige DB-persistentie."""
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from ..schemas import CreateInvestorProfileInput, UpdateInvestorGoalInput, GetRiskProfileInput
from ..db import AsyncSessionLocal, User, InvestorProfile
import uuid

RISK_DESCRIPTIONS = {
    "laag": (
        "Jij kiest voor stabiliteit. Je bent bereid minder rendement te accepteren in ruil voor "
        "minder schommelingen. ETFs met obligaties of brede, defensieve spreiding passen goed bij jou."
    ),
    "matig": (
        "Jij kunt tijdelijke dalingen verdragen als de lange termijn vooruitzichten goed zijn. "
        "Een brede, wereldwijde aandelen-ETF past goed bij jouw profiel."
    ),
    "hoog": (
        "Jij kijkt verder dan kortetermijn-schommelingen en accepteert hogere volatiliteit voor "
        "potentieel meer groei. Aandelen-ETFs met bredere regionale spreiding passen goed bij jou."
    ),
}

HORIZON_LABELS = {
    range(1, 3): "zeer kort (1–2 jaar)",
    range(3, 6): "kort (3–5 jaar)",
    range(6, 11): "middellang (6–10 jaar)",
    range(11, 21): "lang (11–20 jaar)",
    range(21, 41): "zeer lang (21+ jaar)",
}


def _horizon_label(years: int) -> str:
    for r, label in HORIZON_LABELS.items():
        if years in r:
            return label
    return f"{years} jaar"


async def handle_create_investor_profile(arguments: dict) -> dict:
    """Maak of vervang investeerdersprofiel in de database."""
    try:
        data = CreateInvestorProfileInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    async with AsyncSessionLocal() as session:
        try:
            # Upsert: verwijder bestaand profiel als het er is
            existing = await session.scalar(
                select(InvestorProfile).where(InvestorProfile.user_id == data.user_id)
            )
            if existing:
                await session.delete(existing)
                await session.flush()

            profile = InvestorProfile(
                id=uuid.uuid4(),
                user_id=data.user_id,
                goal_type=data.goal_type,
                goal_description=data.goal_description,
                horizon_years=data.horizon_years,
                monthly_budget=float(data.monthly_budget),
                emergency_fund_ready=data.emergency_fund_ready,
                risk_tolerance=data.risk_tolerance,
                experience_level=data.experience_level,
            )
            session.add(profile)
            await session.commit()
            await session.refresh(profile)

            return {
                "success": True,
                "data": {
                    "profile_id": str(profile.id),
                    "user_id": str(profile.user_id),
                    "goal_type": profile.goal_type,
                    "horizon_years": profile.horizon_years,
                    "monthly_budget": float(profile.monthly_budget),
                    "risk_tolerance": profile.risk_tolerance,
                    "experience_level": profile.experience_level,
                    "created_at": profile.created_at.isoformat() if profile.created_at else None,
                },
                "error": None,
            }
        except IntegrityError as e:
            await session.rollback()
            return {"success": False, "data": None, "error": {"code": "DB_INTEGRITY_ERROR", "message": str(e.orig)}}
        except Exception as e:
            await session.rollback()
            return {"success": False, "data": None, "error": {"code": "DB_ERROR", "message": str(e)}}


async def handle_update_investor_goal(arguments: dict) -> dict:
    """Werk doel of horizon bij voor een bestaand profiel."""
    try:
        data = UpdateInvestorGoalInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    async with AsyncSessionLocal() as session:
        profile = await session.scalar(
            select(InvestorProfile).where(InvestorProfile.user_id == data.user_id)
        )
        if not profile:
            return {"success": False, "data": None, "error": {"code": "PROFILE_NOT_FOUND", "message": f"Geen profiel gevonden voor user {data.user_id}."}}

        if data.goal_type is not None:
            profile.goal_type = data.goal_type
        if data.goal_description is not None:
            profile.goal_description = data.goal_description
        if data.horizon_years is not None:
            profile.horizon_years = data.horizon_years

        try:
            await session.commit()
            return {
                "success": True,
                "data": {
                    "user_id": str(data.user_id),
                    "goal_type": profile.goal_type,
                    "horizon_years": profile.horizon_years,
                    "goal_description": profile.goal_description,
                },
                "error": None,
            }
        except Exception as e:
            await session.rollback()
            return {"success": False, "data": None, "error": {"code": "DB_ERROR", "message": str(e)}}


async def handle_get_risk_profile_summary(arguments: dict) -> dict:
    """Haal een uitlegbare risicoprofielsamenvatting op voor een gebruiker."""
    try:
        data = GetRiskProfileInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    async with AsyncSessionLocal() as session:
        profile = await session.scalar(
            select(InvestorProfile).where(InvestorProfile.user_id == data.user_id)
        )
        if not profile:
            return {"success": False, "data": None, "error": {"code": "PROFILE_NOT_FOUND", "message": f"Geen profiel gevonden voor user {data.user_id}."}}

        risk_desc = RISK_DESCRIPTIONS[profile.risk_tolerance]
        horizon_label = _horizon_label(profile.horizon_years)

        summary = (
            f"Je beleggingshorizon is {horizon_label}. "
            f"Jouw risicoprofiel is **{profile.risk_tolerance}**: {risk_desc} "
            f"Je maandelijks budget is €{float(profile.monthly_budget):.0f}. "
            f"Doel: {profile.goal_type.replace('_', ' ')}."
        )

        return {
            "success": True,
            "data": {
                "user_id": str(profile.user_id),
                "risk_tolerance": profile.risk_tolerance,
                "horizon_years": profile.horizon_years,
                "horizon_label": horizon_label,
                "monthly_budget": float(profile.monthly_budget),
                "goal_type": profile.goal_type,
                "experience_level": profile.experience_level,
                "emergency_fund_ready": profile.emergency_fund_ready,
                "summary": summary,
            },
            "error": None,
        }
