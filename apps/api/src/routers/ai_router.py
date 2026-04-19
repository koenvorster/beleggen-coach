"""FastAPI AI router — Ollama agent endpoints."""
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..ai import get_client, get_orchestrator, get_runner
from ..ai.chat_memory import add_message, get_context_messages
from ..ai.profile_context import build_system_prompt, load_profile_for_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["ai"])

_OLLAMA_UNAVAILABLE_NL = (
    "Sorry, de AI-assistent is momenteel niet beschikbaar. "
    "Controleer of Ollama actief is op je systeem, of probeer het later opnieuw."
)


# ─── Request / Response schemas ─────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., min_length=1)
    agent: str = Field(default="gedragscoach")


class ChatResponse(BaseModel):
    response: str
    agent: str
    interaction_id: str


class ETFUitlegRequest(BaseModel):
    ticker: str
    naam: str
    ter: str
    spreiding: int
    beginner_score: int = Field(..., ge=0, le=100)
    user_ervaring: str = Field(default="beginner")


class LeerRequest(BaseModel):
    concept: str = Field(..., min_length=2)
    user_ervaring: str = Field(default="beginner")


class PlanRequest(BaseModel):
    etf_ticker: str
    maandelijks_bedrag: str
    horizon_jaren: int = Field(..., ge=1, le=40)
    risico_score: int = Field(..., ge=0, le=100)
    beleggingsdoel: str


class FeedbackRequest(BaseModel):
    interaction_id: str
    rating: int = Field(..., ge=1, le=5)
    notes: str = ""


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/health")
async def ai_health() -> dict:
    """Controleer of Ollama beschikbaar is."""
    client = get_client()
    available = await client.is_available()
    models: list[str] = []
    if available:
        try:
            models = await client.list_models()
        except Exception:
            pass
    return {
        "ollama_available": available,
        "models": models,
        "agents": get_runner().list_agents(),
    }


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    user_id: str | None = Query(default=None),
) -> ChatResponse:
    """
    Stuur een bericht naar een AI-agent en ontvang een antwoord.

    Gebruik agent='gedragscoach', 'etf_adviseur', 'leer_assistent' of 'plan_generator'.
    Optioneel: stuur X-User-Id header of ?user_id= query param voor geheugen per gebruiker.
    Het investeerdersprofiel en top-3 ETFs worden automatisch als context ingeladen.
    """
    resolved_user_id = x_user_id or user_id or "anonymous"

    runner = get_runner()
    agent = runner.get(body.agent)
    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent '{body.agent}' niet gevonden. Beschikbaar: {runner.list_agents()}",
        )

    # Laatste gebruikersbericht uit de request
    last_user_message = next(
        (m.content for m in reversed(body.messages) if m.role == "user"), ""
    )

    # Laad investeerdersprofiel + top-3 ETFs voor dynamische system prompt
    try:
        profile_ctx = await load_profile_for_user(db, resolved_user_id)
        dynamic_system_prompt = build_system_prompt(profile_ctx)
    except Exception as profile_exc:
        logger.warning(
            "Profiel context laden mislukt (user=%s): %s — doorgaan zonder profiel",
            resolved_user_id, profile_exc,
        )
        dynamic_system_prompt = None

    # Sla het gebruikersbericht op in Redis en haal context op (faalt stil)
    try:
        await add_message(resolved_user_id, "user", last_user_message)
        context_messages = await get_context_messages(resolved_user_id)
    except Exception as mem_exc:
        logger.warning(
            "Chat memory fout (user=%s): %s — doorgaan zonder context",
            resolved_user_id, mem_exc,
        )
        context_messages = [{"role": m.role, "content": m.content} for m in body.messages]

    try:
        response = await agent.chat(
            context_messages,
            system_prompt_override=dynamic_system_prompt,
        )
    except Exception as exc:
        logger.error("Chat fout (agent=%s): %s", body.agent, exc)
        response = _OLLAMA_UNAVAILABLE_NL

    # Sla het assistant-antwoord op in Redis (faalt stil)
    try:
        await add_message(resolved_user_id, "assistant", response)
    except Exception as mem_exc:
        logger.warning("Chat memory opslaan fout (user=%s): %s", resolved_user_id, mem_exc)

    from ..ai.prompt_iterator import PromptIterator
    iterator = PromptIterator(body.agent)
    interaction_id = iterator.log_interaction(
        user_input=last_user_message,
        agent_output=response,
        metadata={"agent": body.agent, "user_id": resolved_user_id},
    )

    return ChatResponse(response=response, agent=body.agent, interaction_id=interaction_id)


@router.post("/etf/uitleg")
async def etf_uitleg(body: ETFUitlegRequest) -> dict:
    """Genereer begrijpelijke uitleg van een ETF voor de gebruiker."""
    orchestrator = get_orchestrator()
    try:
        result = await orchestrator.run_etf_uitleg_workflow(
            etf_ticker=body.ticker,
            etf_naam=body.naam,
            ter=body.ter,
            spreiding=body.spreiding,
            beginner_score=body.beginner_score,
            user_ervaring=body.user_ervaring,
        )
    except Exception as exc:
        logger.error("ETF uitleg fout: %s", exc)
        raise HTTPException(status_code=503, detail="AI service niet beschikbaar.")

    return {
        "success": result.success,
        "data": result.outputs,
        "error": result.errors[0] if result.errors else None,
    }


@router.post("/leer")
async def leer_concept(body: LeerRequest) -> dict:
    """Leg een beleggingsconcept uit in begrijpelijke taal."""
    orchestrator = get_orchestrator()
    try:
        result = await orchestrator.run_leer_module_workflow(
            concept=body.concept,
            user_ervaring=body.user_ervaring,
        )
    except Exception as exc:
        logger.error("Leer fout: %s", exc)
        raise HTTPException(status_code=503, detail="AI service niet beschikbaar.")

    return {
        "success": result.success,
        "data": result.outputs,
        "error": result.errors[0] if result.errors else None,
    }


@router.post("/plan")
async def genereer_plan(body: PlanRequest) -> dict:
    """Genereer een educatief beleggingsplan op basis van profiel en ETF-keuze."""
    orchestrator = get_orchestrator()
    try:
        result = await orchestrator.run_plan_generatie_workflow(
            user_id="anonymous",
            etf_ticker=body.etf_ticker,
            maandelijks_bedrag=body.maandelijks_bedrag,
            horizon_jaren=body.horizon_jaren,
            risico_score=body.risico_score,
            beleggingsdoel=body.beleggingsdoel,
        )
    except Exception as exc:
        logger.error("Plan generatie fout: %s", exc)
        raise HTTPException(status_code=503, detail="AI service niet beschikbaar.")

    return {
        "success": result.success,
        "data": result.outputs,
        "error": result.errors[0] if result.errors else None,
    }


@router.post("/feedback")
async def geef_feedback(body: FeedbackRequest) -> dict:
    """Geef feedback op een AI-interactie (1–5 sterren)."""
    from ..ai.prompt_iterator import PromptIterator

    # Haal agent naam uit interaction_id (eerste deel voor _)
    agent_name = body.interaction_id.split("_")[0]
    iterator = PromptIterator(agent_name)
    success = iterator.add_feedback(body.interaction_id, body.rating, body.notes)

    if not success:
        raise HTTPException(status_code=404, detail="Interactie niet gevonden.")

    return {"success": True, "message": "Feedback opgeslagen."}
