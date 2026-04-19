"""
market-data-mcp — MCP server voor synthetische marktdata, volatiliteit en drawdown

Tools:
  - get_price_history
  - calculate_volatility
  - calculate_drawdown
  - compare_performance
"""
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import json
import asyncio

from .tools import (
    handle_get_price_history,
    handle_calculate_volatility,
    handle_calculate_drawdown,
    handle_compare_performance,
)

server = Server("market-data-mcp")

TOOLS: list[Tool] = [
    Tool(
        name="get_price_history",
        description="Geef synthetische maandelijkse prijsgeschiedenis van een ETF op ISIN.",
        inputSchema={
            "type": "object",
            "properties": {
                "isin": {"type": "string", "minLength": 12, "maxLength": 12},
                "years": {"type": "integer", "minimum": 1, "maximum": 10},
            },
            "required": ["isin", "years"],
        },
    ),
    Tool(
        name="calculate_volatility",
        description="Bereken en leg de volatiliteit van een ETF uit in begrijpelijk Nederlands.",
        inputSchema={
            "type": "object",
            "properties": {
                "isin": {"type": "string", "minLength": 12, "maxLength": 12},
            },
            "required": ["isin"],
        },
    ),
    Tool(
        name="calculate_drawdown",
        description="Bereken de maximale koersdaling (drawdown) van een ETF en geef historische context.",
        inputSchema={
            "type": "object",
            "properties": {
                "isin": {"type": "string", "minLength": 12, "maxLength": 12},
            },
            "required": ["isin"],
        },
    ),
    Tool(
        name="compare_performance",
        description="Vergelijk rendement, volatiliteit en drawdown van meerdere ETFs.",
        inputSchema={
            "type": "object",
            "properties": {
                "isins": {"type": "array", "items": {"type": "string"}, "minItems": 2, "maxItems": 5},
                "years": {"type": "integer", "minimum": 1, "maximum": 10, "default": 3},
            },
            "required": ["isins"],
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
        "get_price_history": handle_get_price_history,
        "calculate_volatility": handle_calculate_volatility,
        "calculate_drawdown": handle_calculate_drawdown,
        "compare_performance": handle_compare_performance,
    }
    handler = handlers.get(name)
    if not handler:
        return {"success": False, "data": None, "error": {"code": "UNKNOWN_TOOL", "message": f"Tool '{name}' bestaat niet."}}
    return await handler(arguments)


def main() -> None:
    asyncio.run(stdio_server(server))
