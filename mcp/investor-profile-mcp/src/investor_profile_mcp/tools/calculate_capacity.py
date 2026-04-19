"""Tool: calculate_monthly_investment_capacity"""
from ..schemas import CalculateCapacityInput

EMERGENCY_FUND_TARGET_MONTHS = 3


async def handle_calculate_monthly_investment_capacity(arguments: dict) -> dict:
    """Bereken beleggingscapaciteit op basis van inkomen, uitgaven en spaarbuffer."""
    try:
        data = CalculateCapacityInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    monthly_surplus = data.monthly_income - data.monthly_expenses

    if monthly_surplus <= 0:
        return {
            "success": True,
            "data": {
                "investable_amount": 0.0,
                "explanation": (
                    "Op basis van jouw inkomsten en uitgaven is er momenteel geen maandelijks overschot. "
                    "Het is verstandig om eerst je budget in balans te brengen voor je begint met beleggen."
                ),
                "has_emergency_fund": data.emergency_fund_months >= EMERGENCY_FUND_TARGET_MONTHS,
                "recommendation": "budget_review",
            },
            "error": None,
        }

    target_emergency = data.monthly_expenses * EMERGENCY_FUND_TARGET_MONTHS
    emergency_gap = max(0.0, target_emergency - data.current_savings)
    emergency_monthly_needed = round(emergency_gap / 6, 2) if emergency_gap > 0 else 0.0

    investable = round(min(max(0.0, monthly_surplus - emergency_monthly_needed), monthly_surplus * 0.80), 2)

    explanation_parts = [f"Jouw maandelijks overschot is €{monthly_surplus:.0f}."]
    if emergency_gap > 0:
        explanation_parts.append(
            f"Je hebt nog geen volledig noodfonds (doel: €{target_emergency:.0f}). "
            f"We reserveren €{emergency_monthly_needed:.0f}/maand daarvoor."
        )
    explanation_parts.append(f"Realistisch belegbaar bedrag: €{investable:.0f} per maand.")

    return {
        "success": True,
        "data": {
            "investable_amount": investable,
            "monthly_surplus": monthly_surplus,
            "emergency_fund_gap": round(emergency_gap, 2),
            "emergency_monthly_allocation": emergency_monthly_needed,
            "has_emergency_fund": emergency_gap == 0,
            "explanation": " ".join(explanation_parts),
            "recommendation": "start_investing" if investable >= 25 else "save_first",
        },
        "error": None,
    }
