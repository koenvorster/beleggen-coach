"""
learning-content-mcp — MCP server voor educatieve beleggingsinhoud voor beginners

Tools:
  - explain_in_simple_language
  - recommend_learning_path
  - generate_beginner_quiz
  - summarize_investment_concept
"""
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import json
import asyncio

from .tools import (
    handle_explain_in_simple_language,
    handle_recommend_learning_path,
    handle_generate_beginner_quiz,
    handle_summarize_investment_concept,
)

server = Server("learning-content-mcp")

TOOLS: list[Tool] = [
    Tool(
        name="explain_in_simple_language",
        description="Leg een beleggingsconcept uit in eenvoudig, jargonvrij Nederlands.",
        inputSchema={
            "type": "object",
            "properties": {
                "concept": {"type": "string"},
            },
            "required": ["concept"],
        },
    ),
    Tool(
        name="recommend_learning_path",
        description="Stel een leerpad samen van 5-7 concepten op basis van ervaringsniveau en doelstelling.",
        inputSchema={
            "type": "object",
            "properties": {
                "experience_level": {"type": "string", "enum": ["geen", "basis", "gevorderd"]},
                "goal_type": {"type": "string"},
            },
            "required": ["experience_level", "goal_type"],
        },
    ),
    Tool(
        name="generate_beginner_quiz",
        description="Genereer drie meerkeuzevragen over een beleggingsconcept voor beginners.",
        inputSchema={
            "type": "object",
            "properties": {
                "concept": {"type": "string"},
            },
            "required": ["concept"],
        },
    ),
    Tool(
        name="summarize_investment_concept",
        description="Geef een samenvatting van een beleggingsconcept met kernpunten en veelgemaakte fouten.",
        inputSchema={
            "type": "object",
            "properties": {
                "concept": {"type": "string"},
                "context": {"type": "string"},
            },
            "required": ["concept"],
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
        "explain_in_simple_language": handle_explain_in_simple_language,
        "recommend_learning_path": handle_recommend_learning_path,
        "generate_beginner_quiz": handle_generate_beginner_quiz,
        "summarize_investment_concept": handle_summarize_investment_concept,
    }
    handler = handlers.get(name)
    if not handler:
        return {"success": False, "data": None, "error": {"code": "UNKNOWN_TOOL", "message": f"Tool '{name}' bestaat niet."}}
    return await handler(arguments)


def main() -> None:
    asyncio.run(stdio_server(server))
