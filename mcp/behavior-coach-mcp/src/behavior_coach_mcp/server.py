"""
behavior-coach-mcp — MCP server voor gedragscoaching van beginnende beleggers

Tools:
  - detect_fomo_pattern
  - detect_overtrading_risk
  - generate_reflection_prompt
  - monthly_checkin_summary
"""
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import json
import asyncio

from .tools import (
    handle_detect_fomo_pattern,
    handle_detect_overtrading_risk,
    handle_generate_reflection_prompt,
    handle_monthly_checkin_summary,
)

server = Server("behavior-coach-mcp")

TOOLS: list[Tool] = [
    Tool(
        name="detect_fomo_pattern",
        description="Detecteer FOMO-patronen in een bericht van de gebruiker en geef een rustige, coachende reactie.",
        inputSchema={
            "type": "object",
            "properties": {
                "user_message": {"type": "string"},
                "recent_market_event": {"type": "string"},
            },
            "required": ["user_message"],
        },
    ),
    Tool(
        name="detect_overtrading_risk",
        description="Analyseer het risico op overhandelen op basis van schakelverzoeken en tijd sinds laatste wissel.",
        inputSchema={
            "type": "object",
            "properties": {
                "switch_requests_this_month": {"type": "integer", "minimum": 0},
                "days_since_last_switch": {"type": "integer", "minimum": 0},
            },
            "required": ["switch_requests_this_month"],
        },
    ),
    Tool(
        name="generate_reflection_prompt",
        description="Genereer drie reflectievragen op basis van de emotionele staat van de gebruiker.",
        inputSchema={
            "type": "object",
            "properties": {
                "emotional_state": {
                    "type": "string",
                    "enum": ["rustig", "onzeker", "bezorgd", "enthousiast", "gestresst"],
                },
                "trigger": {"type": "string"},
            },
            "required": ["emotional_state"],
        },
    ),
    Tool(
        name="monthly_checkin_summary",
        description="Genereer een warme maandelijkse check-in samenvatting voor de belegger.",
        inputSchema={
            "type": "object",
            "properties": {
                "invested": {"type": "boolean"},
                "emotional_state": {"type": "string"},
                "notes": {"type": "string"},
                "plan_goal": {"type": "string"},
            },
            "required": ["invested", "emotional_state"],
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
        "detect_fomo_pattern": handle_detect_fomo_pattern,
        "detect_overtrading_risk": handle_detect_overtrading_risk,
        "generate_reflection_prompt": handle_generate_reflection_prompt,
        "monthly_checkin_summary": handle_monthly_checkin_summary,
    }
    handler = handlers.get(name)
    if not handler:
        return {"success": False, "data": None, "error": {"code": "UNKNOWN_TOOL", "message": f"Tool '{name}' bestaat niet."}}
    return await handler(arguments)


def main() -> None:
    asyncio.run(stdio_server(server))
