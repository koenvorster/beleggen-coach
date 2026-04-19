"""Pydantic schemas voor portfolio-plan-mcp."""
from pydantic import BaseModel, Field
from typing import Literal, Optional

RiskTolerance = Literal["laag", "matig", "hoog"]


class GenerateBeginnerPlanInput(BaseModel):
    risk_tolerance: RiskTolerance
    horizon_years: int = Field(..., ge=1, le=40)
    monthly_budget: float = Field(..., ge=1)
    goal_type: str


class SimulateMonthlyInvestingInput(BaseModel):
    monthly_amount: float = Field(..., ge=1)
    horizon_years: int = Field(..., ge=1, le=40)
    pessimistic_rate: float = Field(0.03, ge=0, le=1)
    realistic_rate: float = Field(0.06, ge=0, le=1)
    optimistic_rate: float = Field(0.09, ge=0, le=1)


class SuggestAllocationInput(BaseModel):
    risk_tolerance: str
    horizon_years: int = Field(..., ge=1, le=40)
    include_bonds: bool = True


class AllocationItem(BaseModel):
    etf_isin: str
    percentage: float


class CheckDiversificationInput(BaseModel):
    allocation: list[AllocationItem]
