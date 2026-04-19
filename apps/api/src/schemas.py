"""Pydantic schemas voor request/response validatie."""
from pydantic import BaseModel, Field, EmailStr, UUID4
from typing import Optional, Literal

GoalType = Literal["pensioen", "huis_kopen", "studie_kind", "noodfonds", "vermogen_opbouwen", "anders"]
RiskTolerance = Literal["laag", "matig", "hoog"]
ExperienceLevel = Literal["geen", "basis", "gevorderd"]


# ─── User ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    naam: str = Field(..., min_length=1, max_length=255)
    taal: Literal["nl", "fr", "en"] = "nl"


class UserResponse(BaseModel):
    id: UUID4
    email: str
    naam: str
    taal: str

    model_config = {"from_attributes": True}


# ─── Onboarding / InvestorProfile ────────────────────────────────────────────

class OnboardingStartRequest(BaseModel):
    """Stap 1: gebruikersaccount aanmaken."""
    email: EmailStr
    naam: str = Field(..., min_length=1, max_length=255)
    taal: Literal["nl", "fr", "en"] = "nl"


class OnboardingProfileRequest(BaseModel):
    """Stap 2: profiel invullen na onboarding wizard."""
    goal_type: GoalType
    goal_description: Optional[str] = Field(None, max_length=500)
    horizon_years: int = Field(..., ge=1, le=40)
    monthly_budget: float = Field(..., ge=10, le=100_000)
    emergency_fund_ready: bool
    risk_tolerance: RiskTolerance
    experience_level: ExperienceLevel


class InvestorProfileResponse(BaseModel):
    id: UUID4
    user_id: UUID4
    goal_type: str
    horizon_years: int
    monthly_budget: float
    risk_tolerance: str
    experience_level: str
    emergency_fund_ready: bool

    model_config = {"from_attributes": True}


class OnboardingSummaryResponse(BaseModel):
    user: UserResponse
    profile: InvestorProfileResponse
    risk_summary: str
    next_step: str


# ─── Plan ────────────────────────────────────────────────────────────────────

class AllocationItemSchema(BaseModel):
    etf_isin: str
    percentage: float = Field(..., ge=0, le=100)
    rationale: str


class PlanCreate(BaseModel):
    monthly_amount: float = Field(..., ge=10)
    allocation: list[AllocationItemSchema]
    rationale: str
    risk_notes: str


class PlanResponse(BaseModel):
    id: UUID4
    user_id: UUID4
    monthly_amount: float
    allocation: list[dict]
    rationale: str
    risk_notes: str

    model_config = {"from_attributes": True}


# ─── Portfolio ────────────────────────────────────────────────────────────────
import datetime  # noqa: E402


class PortfolioPositionCreate(BaseModel):
    etf_isin: str = Field(..., min_length=12, max_length=20)
    etf_ticker: str = Field(..., min_length=1, max_length=10)
    shares: float = Field(..., gt=0)
    buy_price_eur: float = Field(..., gt=0)
    buy_date: datetime.date
    notes: Optional[str] = Field(None, max_length=1000)


class PortfolioPositionResponse(BaseModel):
    id: UUID4
    user_id: UUID4
    etf_isin: str
    etf_ticker: str
    shares: float
    buy_price_eur: float
    buy_date: datetime.date
    notes: Optional[str]
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


# ─── CheckIn ─────────────────────────────────────────────────────────────────
class CheckInCreate(BaseModel):
    month: str = Field(..., pattern=r"^\d{4}-\d{2}$")
    invested: bool
    emotional_state: Literal["rustig", "onzeker", "enthousiast", "bang", "neutraal"]
    notes: Optional[str] = Field(None, max_length=1000)


class CheckInResponse(BaseModel):
    id: UUID4
    user_id: UUID4
    month: str
    invested: bool
    emotional_state: str
    notes: Optional[str]
    coach_response: Optional[str]

    model_config = {"from_attributes": True}
