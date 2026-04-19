"""Pydantic schemas voor investor-profile-mcp tools."""
from pydantic import BaseModel, Field, UUID4
from typing import Optional, Literal


GoalType = Literal["pensioen", "huis_kopen", "studie_kind", "noodfonds", "vermogen_opbouwen", "anders"]
RiskTolerance = Literal["laag", "matig", "hoog"]
ExperienceLevel = Literal["geen", "basis", "gevorderd"]


class CreateInvestorProfileInput(BaseModel):
    user_id: UUID4
    goal_type: GoalType
    goal_description: Optional[str] = Field(None, max_length=500)
    horizon_years: int = Field(..., ge=1, le=40)
    monthly_budget: float = Field(..., ge=10, le=100_000)
    emergency_fund_ready: bool
    risk_tolerance: RiskTolerance
    experience_level: ExperienceLevel


class UpdateInvestorGoalInput(BaseModel):
    user_id: UUID4
    goal_type: Optional[GoalType] = None
    goal_description: Optional[str] = None
    horizon_years: Optional[int] = Field(None, ge=1, le=40)


class CalculateCapacityInput(BaseModel):
    monthly_income: float = Field(..., ge=0)
    monthly_expenses: float = Field(..., ge=0)
    emergency_fund_months: int = Field(3, ge=0, le=24)
    current_savings: float = Field(0.0, ge=0)


class GetRiskProfileInput(BaseModel):
    user_id: UUID4
