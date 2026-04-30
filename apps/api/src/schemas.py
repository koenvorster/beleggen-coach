"""Pydantic schemas voor request/response validatie."""
import datetime  # noqa: E402
import re
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, EmailStr, UUID4, field_validator
from typing import Optional, Literal

GoalType = Literal["pensioen", "huis_kopen", "studie_kind", "noodfonds", "vermogen_opbouwen", "anders"]
RiskTolerance = Literal["laag", "matig", "hoog"]
ExperienceLevel = Literal["geen", "basis", "gevorderd"]
ETFCategory = Literal["equity", "bond", "mixed", "real_estate", "commodity"]
ReplicationMethod = Literal["physical", "synthetic"]


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

    model_config = ConfigDict(from_attributes=True)


# ─── ETF ─────────────────────────────────────────────────────────────────────

class ETFCreate(BaseModel):
    """Schema voor het aanmaken van een nieuw ETF."""

    isin: str = Field(..., min_length=12, max_length=12)
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    category: ETFCategory
    ter: float = Field(..., ge=0.0, le=5.0, description="Total Expense Ratio als decimaal (bijv. 0.20)")
    risk_level: int = Field(..., ge=1, le=7)
    currency: str = Field("EUR", min_length=3, max_length=3)
    benchmark: Optional[str] = Field(None, max_length=255)
    fund_size_m: Optional[float] = Field(None, ge=0)
    ytd_return: Optional[float] = None
    one_year_return: Optional[float] = None
    three_year_return: Optional[float] = None
    inception_date: Optional[datetime.date] = None
    is_accumulating: bool = True
    replication_method: ReplicationMethod = "physical"
    domicile: str = Field("IE", min_length=2, max_length=2)

    @field_validator("isin")
    @classmethod
    def validate_isin(cls, v: str) -> str:
        """Valideer ISIN-formaat: 12 tekens, begint met 2-letterige landcode."""
        if not re.match(r"^[A-Z]{2}[A-Z0-9]{10}$", v):
            raise ValueError("ISIN moet 12 tekens zijn en beginnen met een 2-letterige landcode (bijv. IE00B4L5Y983).")
        return v


class ETFResponse(BaseModel):
    """Schema voor ETF-response (DTO van ETFProduct aggregate)."""

    isin: str
    name: str
    description: Optional[str]
    category: str
    ter: float  # weergegeven als float in API
    risk_level: int  # 1-7
    risk_label: str  # "Conservative", "Moderate", etc.
    dividend_yield: float  # weergegeven als float in API
    currency: str
    benchmark: Optional[str]
    fund_size_m: Optional[float]
    ytd_return: Optional[float]
    one_year_return: Optional[float]
    three_year_return: Optional[float]
    inception_date: Optional[datetime.date]
    is_accumulating: bool
    replication_method: str
    domicile: str

    model_config = ConfigDict(from_attributes=True)


class ETFDetailResponse(ETFResponse):
    """Schema voor gedetailleerde ETF-response met vergelijkbare ETFs."""
    similar_etfs: list[ETFResponse] = []


class ListETFsResponse(BaseModel):
    """Schema voor gepagineerde ETF-lijstresponse met facetten."""
    
    etfs: list[ETFResponse]
    count: int  # Aantal in deze pagina
    offset: int  # Paginering offset
    limit: int  # Paginering limit
    total: int  # Totaal aantal zonder paginering
    facets: dict  # {"categories": [...], "risk_levels": [...]}
    
    model_config = ConfigDict(from_attributes=True)



# ─── Plan (update) ────────────────────────────────────────────────────────────

class PlanUpdate(BaseModel):
    """Schema voor het bijwerken van een bestaand beleggingsplan."""

    monthly_amount: Optional[float] = Field(None, ge=10)
    allocation: Optional[list[dict]] = None
    rationale: Optional[str] = None
    risk_notes: Optional[str] = None


# ─── Portfolio summary ────────────────────────────────────────────────────────

class CategoryAllocation(BaseModel):
    """Allocatie per ETF-categorie."""

    category: str
    total_invested: float
    percentage: float


class PortfolioSummaryResponse(BaseModel):
    """Overzicht van de volledige portefeuille."""

    total_invested: float
    position_count: int
    allocations: list[CategoryAllocation]
