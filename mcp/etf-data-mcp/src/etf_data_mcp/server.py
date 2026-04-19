"""
etf-data-mcp — MCP server voor ETF-metadata, filters en vergelijking

Tools:
  - search_etfs
  - get_etf_details
  - compare_etfs
  - filter_etfs_for_beginner_profile
  - get_top3_for_profile
"""
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import json
import asyncio

from .tools import handle_search_etfs, handle_get_etf_details, handle_compare_etfs, handle_filter_etfs_for_beginner, handle_get_top3_for_profile

server = Server("etf-data-mcp")

TOOLS: list[Tool] = [
    Tool(
        name="search_etfs",
        description="Zoek ETFs op naam, ticker, asset klasse of regio.",
        inputSchema={
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "asset_class": {"type": "string", "enum": ["aandelen", "obligaties", "gemengd", "grondstoffen", "vastgoed"]},
                "region_focus": {"type": "string"},
                "max_expense_ratio": {"type": "number", "minimum": 0, "maximum": 5},
                "distribution_type": {"type": "string", "enum": ["accumulating", "distributing"]},
                "limit": {"type": "integer", "minimum": 1, "maximum": 50, "default": 10},
            },
        },
    ),
    Tool(
        name="get_etf_details",
        description="Geef volledige details en scores van één ETF op ISIN.",
        inputSchema={
            "type": "object",
            "properties": {
                "isin": {"type": "string", "minLength": 12, "maxLength": 12},
            },
            "required": ["isin"],
        },
    ),
    Tool(
        name="compare_etfs",
        description="Vergelijk 2 of 3 ETFs naast elkaar op kosten, spreiding en scores.",
        inputSchema={
            "type": "object",
            "properties": {
                "isins": {"type": "array", "items": {"type": "string"}, "minItems": 2, "maxItems": 3},
            },
            "required": ["isins"],
        },
    ),
    Tool(
        name="filter_etfs_for_beginner_profile",
        description="Rangschik ETFs op basis van risicoprofiel, horizon en budget van een beginnende belegger.",
        inputSchema={
            "type": "object",
            "properties": {
                "risk_tolerance": {"type": "string", "enum": ["laag", "matig", "hoog"]},
                "horizon_years": {"type": "integer", "minimum": 1, "maximum": 40},
                "monthly_budget": {"type": "number", "minimum": 10},
                "experience_level": {"type": "string", "enum": ["geen", "basis", "gevorderd"], "default": "geen"},
                "limit": {"type": "integer", "minimum": 1, "maximum": 10, "default": 5},
            },
            "required": ["risk_tolerance", "horizon_years", "monthly_budget"],
        },
    ),
    Tool(
        name="get_top3_for_profile",
        description="Geef de top 3 meest geschikte ETFs voor een gebruikersprofiel, met mensentaal-uitleg en kostenberekening.",
        inputSchema={
            "type": "object",
            "properties": {
                "risk_tolerance": {"type": "string", "enum": ["laag", "matig", "hoog"], "description": "Risicotolerantie van de gebruiker"},
                "horizon_years": {"type": "integer", "minimum": 1, "maximum": 40, "description": "Beleggingshorizon in jaren"},
                "monthly_budget": {"type": "number", "minimum": 10, "description": "Maandelijks inlegbedrag in EUR"},
                "experience_level": {"type": "string", "enum": ["geen", "basis", "gevorderd"], "default": "geen", "description": "Beleggingservaring van de gebruiker"},
            },
            "required": ["risk_tolerance", "horizon_years", "monthly_budget"],
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
        "search_etfs": handle_search_etfs,
        "get_etf_details": handle_get_etf_details,
        "compare_etfs": handle_compare_etfs,
        "filter_etfs_for_beginner_profile": handle_filter_etfs_for_beginner,
        "get_top3_for_profile": handle_get_top3_for_profile,
    }
    handler = handlers.get(name)
    if not handler:
        return {"success": False, "data": None, "error": {"code": "UNKNOWN_TOOL", "message": f"Tool '{name}' bestaat niet."}}
    return await handler(arguments)


def main() -> None:
    asyncio.run(stdio_server(server))
