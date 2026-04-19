"""Onboarding router — endpoints voor gebruikersregistratie en profielopmaak."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from ..auth import get_optional_user
from ..database import get_db
from ..schemas import (
    OnboardingStartRequest,
    OnboardingProfileRequest,
    UserResponse,
    InvestorProfileResponse,
    OnboardingSummaryResponse,
)
from ..services import create_or_get_user, save_investor_profile, get_onboarding_summary

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.post(
    "/start",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Stap 1: Maak account aan of haal bestaand op",
)
async def onboarding_start(
    body: OnboardingStartRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str | None = Depends(get_optional_user),
) -> UserResponse:
    """
    Registreert een nieuwe gebruiker of geeft de bestaande terug.
    Idempotent op e-mailadres.
    """
    user, created = await create_or_get_user(db, body)
    return UserResponse.model_validate(user)


@router.put(
    "/{user_id}/profile",
    response_model=InvestorProfileResponse,
    summary="Stap 2: Sla investeerdersprofiel op",
)
async def onboarding_profile(
    user_id: str,
    body: OnboardingProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str | None = Depends(get_optional_user),
) -> InvestorProfileResponse:
    """
    Slaat het investeerdersprofiel op na de onboarding wizard.
    Upsert: werkt zowel voor nieuwe als bestaande profielen.
    """
    profile = await save_investor_profile(db, user_id, body)
    return InvestorProfileResponse.model_validate(profile)


@router.get(
    "/{user_id}/summary",
    response_model=OnboardingSummaryResponse,
    summary="Stap 3: Haal onboarding-samenvatting op",
)
async def onboarding_summary(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: str | None = Depends(get_optional_user),
) -> OnboardingSummaryResponse:
    """
    Geeft een volledige samenvatting van gebruiker + profiel + risico-uitleg.
    Wordt gebruikt door het dashboard na het afronden van de onboarding.
    """
    result = await get_onboarding_summary(db, user_id)
    if not result:
        raise HTTPException(status_code=404, detail="Gebruiker niet gevonden.")
    if result["profile"] is None:
        raise HTTPException(status_code=404, detail="Profiel nog niet ingevuld. Gebruik PUT /{user_id}/profile eerst.")

    return OnboardingSummaryResponse(
        user=UserResponse.model_validate(result["user"]),
        profile=InvestorProfileResponse.model_validate(result["profile"]),
        risk_summary=result["risk_summary"],
        next_step=result["next_step"],
    )
