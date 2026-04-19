"""
portfolio-plan-mcp — MCP server voor portefeuilleplannen en simulaties voor beginners

Tools:
  - generate_beginner_plan
  - simulate_monthly_investing
  - suggest_allocation
  - check_diversification
"""
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import json
import asyncio

from .tools import (
    handle_generate_beginner_plan,
    handle_simulate_monthly_investing,
    handle_suggest_allocation,
    handle_check_diversification,
)

server = Server("portfolio-plan-mcp")

TOOLS: list[Tool] = [
    Tool(
        name="generate_beginner_plan",
        description="Genereer een eenvoudig beleggingsplan voor beginners op basis van risicoprofiel, horizon en budget.",
        inputSchema={
            "type": "object",
            "properties": {
                "risk_tolerance": {"type": "string", "enum": ["laag", "matig", "hoog"]},
                "horizon_years": {"type": "integer", "minimum": 1, "maximum": 40},
                "monthly_budget": {"type": "number", "minimum": 1},
                "goal_type": {"type": "string"},
            },
            "required": ["risk_tolerance", "horizon_years", "monthly_budget", "goal_type"],
        },
    ),
    Tool(
        name="simulate_monthly_investing",
        description="Simuleer het eindkapitaal van maandelijkse beleggingen onder drie rendementscenario's.",
        inputSchema={
            "type": "object",
            "properties": {
                "monthly_amount": {"type": "number", "minimum": 1},
                "horizon_years": {"type": "integer", "minimum": 1, "maximum": 40},
                "pessimistic_rate": {"type": "number", "default": 0.03},
                "realistic_rate": {"type": "number", "default": 0.06},
                "optimistic_rate": {"type": "number", "default": 0.09},
            },
            "required": ["monthly_amount", "horizon_years"],
        },
    ),
    Tool(
        name="suggest_allocation",
        description="Stel een eenvoudige ETF-allocatie voor op basis van risicoprofiel en horizon.",
        inputSchema={
            "type": "object",
            "properties": {
                "risk_tolerance": {"type": "string"},
                "horizon_years": {"type": "integer", "minimum": 1, "maximum": 40},
                "include_bonds": {"type": "boolean", "default": True},
            },
            "required": ["risk_tolerance", "horizon_years"],
        },
    ),
    Tool(
        name="check_diversification",
        description="Controleer de spreiding van een voorgestelde ETF-allocatie en geef een score en aanbevelingen.",
        inputSchema={
            "type": "object",
            "properties": {
                "allocation": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "etf_isin": {"type": "string"},
                            "percentage": {"type": "number"},
                        },
                        "required": ["etf_isin", "percentage"],
                    },
                },
            },
            "required": ["allocation"],
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
        "generate_beginner_plan": handle_generate_beginner_plan,
        "simulate_monthly_investing": handle_simulate_monthly_investing,
        "suggest_allocation": handle_suggest_allocation,
        "check_diversification": handle_check_diversification,
    }
    handler = handlers.get(name)
    if not handler:
        return {"success": False, "data": None, "error": {"code": "UNKNOWN_TOOL", "message": f"Tool '{name}' bestaat niet."}}
    return await handler(arguments)


def main() -> None:
    asyncio.run(stdio_server(server))
