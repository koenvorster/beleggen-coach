"""Pydantic schemas voor behavior-coach-mcp."""
from pydantic import BaseModel, Field
from typing import Optional, Literal

EmotionalState = Literal["rustig", "onzeker", "bezorgd", "enthousiast", "gestresst"]


class DetectFomoInput(BaseModel):
    user_message: str
    recent_market_event: Optional[str] = None


class DetectOvertradingRiskInput(BaseModel):
    switch_requests_this_month: int = Field(..., ge=0)
    days_since_last_switch: Optional[int] = Field(None, ge=0)


class GenerateReflectionPromptInput(BaseModel):
    emotional_state: EmotionalState
    trigger: Optional[str] = None


class MonthlyCheckinSummaryInput(BaseModel):
    invested: bool
    emotional_state: str
    notes: Optional[str] = None
    plan_goal: Optional[str] = None
