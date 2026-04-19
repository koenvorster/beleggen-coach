"""Pydantic schemas voor etf-data-mcp."""
from pydantic import BaseModel, Field
from typing import Optional, Literal

AssetClass = Literal["aandelen", "obligaties", "gemengd", "grondstoffen", "vastgoed"]
DistributionType = Literal["accumulating", "distributing"]
RiskTolerance = Literal["laag", "matig", "hoog"]
ExperienceLevel = Literal["geen", "basis", "gevorderd"]


class SearchETFsInput(BaseModel):
    query: Optional[str] = None
    asset_class: Optional[AssetClass] = None
    region_focus: Optional[str] = None
    max_expense_ratio: Optional[float] = Field(None, ge=0, le=5)
    distribution_type: Optional[DistributionType] = None
    limit: int = Field(10, ge=1, le=50)


class GetETFDetailsInput(BaseModel):
    isin: str = Field(..., min_length=12, max_length=12)


class CompareETFsInput(BaseModel):
    isins: list[str] = Field(..., min_length=2, max_length=3)


class FilterForBeginnerInput(BaseModel):
    risk_tolerance: RiskTolerance
    horizon_years: int = Field(..., ge=1, le=40)
    monthly_budget: float = Field(..., ge=10)
    experience_level: ExperienceLevel = "geen"
    limit: int = Field(5, ge=1, le=10)


class GetTop3ForProfileInput(BaseModel):
    risk_tolerance: RiskTolerance
    horizon_years: int = Field(..., ge=1, le=40)
    monthly_budget: float = Field(..., ge=10)
    experience_level: ExperienceLevel = "geen"
