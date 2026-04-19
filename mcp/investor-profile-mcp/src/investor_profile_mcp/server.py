"""
investor-profile-mcp — MCP server voor investeerdersprofiel

Tools:
  - create_investor_profile
  - update_investor_goal
  - calculate_monthly_investment_capacity
  - get_risk_profile_summary
"""
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import json
import asyncio

from .tools.create_profile import handle_create_investor_profile, handle_update_investor_goal, handle_get_risk_profile_summary
from .tools.calculate_capacity import handle_calculate_monthly_investment_capacity
from .schemas import (
    CreateInvestorProfileInput,
    UpdateInvestorGoalInput,
    CalculateCapacityInput,
    GetRiskProfileInput,
)

server = Server("investor-profile-mcp")

TOOLS: list[Tool] = [
    Tool(
        name="create_investor_profile",
        description="Maak een nieuw investeerdersprofiel aan op basis van onboarding-antwoorden.",
        inputSchema={
            "type": "object",
            "properties": {
                "user_id": {"type": "string", "format": "uuid"},
                "goal_type": {
                    "type": "string",
                    "enum": ["pensioen", "huis_kopen", "studie_kind", "noodfonds", "vermogen_opbouwen", "anders"],
                },
                "goal_description": {"type": "string", "maxLength": 500},
                "horizon_years": {"type": "integer", "minimum": 1, "maximum": 40},
                "monthly_budget": {"type": "number", "minimum": 10, "maximum": 100000},
                "emergency_fund_ready": {"type": "boolean"},
                "risk_tolerance": {"type": "string", "enum": ["laag", "matig", "hoog"]},
                "experience_level": {"type": "string", "enum": ["geen", "basis", "gevorderd"]},
            },
            "required": [
                "user_id", "goal_type", "horizon_years",
                "monthly_budget", "emergency_fund_ready",
                "risk_tolerance", "experience_level",
            ],
        },
    ),
    Tool(
        name="update_investor_goal",
        description="Werk het doel of de tijdshorizon van een bestaand profiel bij.",
        inputSchema={
            "type": "object",
            "properties": {
                "user_id": {"type": "string", "format": "uuid"},
                "goal_type": {"type": "string"},
                "goal_description": {"type": "string"},
                "horizon_years": {"type": "integer", "minimum": 1, "maximum": 40},
            },
            "required": ["user_id"],
        },
    ),
    Tool(
        name="calculate_monthly_investment_capacity",
        description="Bereken hoeveel iemand realistisch maandelijks kan beleggen op basis van inkomen en uitgaven.",
        inputSchema={
            "type": "object",
            "properties": {
                "monthly_income": {"type": "number", "minimum": 0},
                "monthly_expenses": {"type": "number", "minimum": 0},
                "emergency_fund_months": {"type": "integer", "minimum": 0, "maximum": 24},
                "current_savings": {"type": "number", "minimum": 0},
            },
            "required": ["monthly_income", "monthly_expenses"],
        },
    ),
    Tool(
        name="get_risk_profile_summary",
        description="Geef een uitlegbare samenvatting van het risicoprofiel van een gebruiker in begrijpelijke taal.",
        inputSchema={
            "type": "object",
            "properties": {
                "user_id": {"type": "string", "format": "uuid"},
            },
            "required": ["user_id"],
        },
    ),
]


@server.list_tools()
async def list_tools() -> list[Tool]:
    return TOOLS


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    result = await _dispatch(name, arguments)
    return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]


async def _dispatch(name: str, arguments: dict) -> dict:
    handlers = {
        "create_investor_profile": handle_create_investor_profile,
        "update_investor_goal": handle_update_investor_goal,
        "calculate_monthly_investment_capacity": handle_calculate_monthly_investment_capacity,
        "get_risk_profile_summary": handle_get_risk_profile_summary,
    }
    handler = handlers.get(name)
    if not handler:
        return {"success": False, "data": None, "error": {"code": "UNKNOWN_TOOL", "message": f"Tool '{name}' bestaat niet."}}
    return await handler(arguments)


def main() -> None:
    asyncio.run(stdio_server(server))
