"""Onboarding service — bevat alle business logic voor gebruiker + profiel aanmaken."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
import uuid

from ..models import User, InvestorProfile
from ..schemas import OnboardingStartRequest, OnboardingProfileRequest

RISK_SUMMARIES = {
    "laag": "Jij kiest voor stabiliteit. Je voorkeur gaat naar minder schommelingen, ook als dat wat minder rendement betekent.",
    "matig": "Jij bent bereid tijdelijke koersdalingen te accepteren voor een beter rendement op lange termijn.",
    "hoog": "Jij bent comfortabel met flinke schommelingen en kijkt naar de lange termijn voor potentieel hogere groei.",
}


async def create_or_get_user(db: AsyncSession, data: OnboardingStartRequest) -> tuple[User, bool]:
    """Maak een nieuwe gebruiker aan of geef de bestaande terug. Returns (user, created)."""
    existing = await db.scalar(select(User).where(User.email == data.email))
    if existing:
        return existing, False

    user = User(id=uuid.uuid4(), email=data.email, naam=data.naam, taal=data.taal)
    db.add(user)
    try:
        await db.commit()
        await db.refresh(user)
        return user, True
    except IntegrityError:
        await db.rollback()
        existing = await db.scalar(select(User).where(User.email == data.email))
        return existing, False


async def save_investor_profile(
    db: AsyncSession,
    user_id: uuid.UUID,
    data: OnboardingProfileRequest,
) -> InvestorProfile:
    """Sla investeerdersprofiel op (upsert op user_id)."""
    existing = await db.scalar(select(InvestorProfile).where(InvestorProfile.user_id == user_id))
    if existing:
        existing.goal_type = data.goal_type
        existing.goal_description = data.goal_description
        existing.horizon_years = data.horizon_years
        existing.monthly_budget = data.monthly_budget
        existing.emergency_fund_ready = data.emergency_fund_ready
        existing.risk_tolerance = data.risk_tolerance
        existing.experience_level = data.experience_level
        await db.commit()
        await db.refresh(existing)
        return existing

    profile = InvestorProfile(
        id=uuid.uuid4(),
        user_id=user_id,
        goal_type=data.goal_type,
        goal_description=data.goal_description,
        horizon_years=data.horizon_years,
        monthly_budget=float(data.monthly_budget),
        emergency_fund_ready=data.emergency_fund_ready,
        risk_tolerance=data.risk_tolerance,
        experience_level=data.experience_level,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


async def get_onboarding_summary(db: AsyncSession, user_id: uuid.UUID) -> dict | None:
    """Haal gebruiker + profiel op als samenvatting."""
    user = await db.scalar(select(User).where(User.id == user_id))
    if not user:
        return None

    profile = await db.scalar(select(InvestorProfile).where(InvestorProfile.user_id == user_id))
    if not profile:
        return {"user": user, "profile": None, "risk_summary": None, "next_step": "complete_profile"}

    risk_summary = RISK_SUMMARIES.get(profile.risk_tolerance, "")
    return {
        "user": user,
        "profile": profile,
        "risk_summary": risk_summary,
        "next_step": "explore_etfs",
    }
