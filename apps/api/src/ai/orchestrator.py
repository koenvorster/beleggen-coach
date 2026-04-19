"""
Beleggingsapp Multi-Agent Orchestrator
Coördineert meerdere AI-agents in beleggen-specifieke workflows.
"""
import asyncio
import structlog
from dataclasses import dataclass, field
from typing import Any

from .agent_runner import AgentRunner, get_runner

logger = structlog.get_logger(__name__)


@dataclass
class OrchestratorStep:
    """Een stap in een orchestratie-workflow."""

    agent_name: str
    description: str
    context_key: str = ""
    required: bool = True
    condition_key: str = ""


@dataclass
class OrchestratorResult:
    """Resultaat van een orchestratie-workflow."""

    workflow_name: str
    steps_completed: int
    steps_total: int
    outputs: dict[str, str] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)
    success: bool = True


class AgentOrchestrator:
    """
    Coördineert meerdere AI-agents in volgorde.

    Gebruik dit voor complexe workflows waarbij agents
    elkaars output als input gebruiken.
    """

    def __init__(self, runner: AgentRunner | None = None):
        self._runner = runner or get_runner()

    async def run_workflow(
        self,
        workflow_name: str,
        steps: list[OrchestratorStep],
        initial_input: str,
        shared_context: dict[str, Any] | None = None,
    ) -> OrchestratorResult:
        """
        Voer een multi-step workflow uit.

        Args:
            workflow_name: Naam voor logging
            steps: Stappen in volgorde
            initial_input: Input voor de eerste stap
            shared_context: Context beschikbaar voor alle stappen

        Returns:
            OrchestratorResult met alle outputs
        """
        context = dict(shared_context or {})
        result = OrchestratorResult(
            workflow_name=workflow_name,
            steps_total=len(steps),
            steps_completed=0,
        )
        current_input = initial_input

        logger.info("Workflow '%s' gestart (%d stappen)", workflow_name, len(steps))

        for i, step in enumerate(steps):
            if step.condition_key and step.condition_key not in context:
                logger.info("Stap %d overgeslagen (conditie '%s' ontbreekt)", i + 1, step.condition_key)
                result.steps_total -= 1
                continue

            logger.info("Stap %d/%d: '%s' — %s", i + 1, len(steps), step.agent_name, step.description)

            try:
                output, _ = await self._runner.run_agent(
                    agent_name=step.agent_name,
                    user_input=current_input,
                    context=context,
                )
                result.steps_completed += 1

                if step.context_key:
                    context[step.context_key] = output
                    result.outputs[step.context_key] = output
                else:
                    result.outputs[f"stap_{i + 1}"] = output

                current_input = output

            except Exception as exc:
                error_msg = f"Stap {i + 1} ({step.agent_name}): {exc}"
                logger.error("Orchestrator fout: %s", error_msg)
                result.errors.append(error_msg)

                if step.required:
                    result.success = False
                    break

        logger.info(
            "Workflow '%s' klaar: %d/%d, succes=%s",
            workflow_name, result.steps_completed, result.steps_total, result.success,
        )
        return result

    async def run_parallel(
        self,
        steps: list[OrchestratorStep],
        shared_input: str,
        shared_context: dict[str, Any] | None = None,
    ) -> dict[str, str]:
        """Voer meerdere agent-stappen tegelijk uit (parallel)."""
        context = dict(shared_context or {})

        async def _run_one(step: OrchestratorStep) -> tuple[str, str]:
            output, _ = await self._runner.run_agent(
                agent_name=step.agent_name,
                user_input=shared_input,
                context=context,
            )
            return step.context_key or step.agent_name, output

        results = await asyncio.gather(*[_run_one(s) for s in steps], return_exceptions=True)

        outputs: dict[str, str] = {}
        for step, result in zip(steps, results):
            if isinstance(result, Exception):
                logger.error("Parallelle stap '%s' mislukt: %s", step.agent_name, result)
                if step.required:
                    raise result
            else:
                key, output = result
                outputs[key] = output
        return outputs

    # ─── Beleggen-specifieke workflows ──────────────────────────────────────

    async def run_checkin_coaching_workflow(
        self,
        user_id: str,
        emotionele_toestand: str,
        check_in_notities: str,
        risico_score: int,
        plan_etf: str,
    ) -> OrchestratorResult:
        """Workflow: check-in ontvangen → gedragscoach respondeert."""
        steps = [
            OrchestratorStep(
                agent_name="gedragscoach",
                description="Gedragspatroon detecteren en coachen",
                context_key="coaching_respons",
            ),
        ]
        return await self.run_workflow(
            workflow_name="checkin_coaching",
            steps=steps,
            initial_input=(
                f"Belegger heeft check-in ingediend. "
                f"Emotionele toestand: {emotionele_toestand}. "
                f"Notities: {check_in_notities}. "
                f"Huidig plan: {plan_etf}."
            ),
            shared_context={
                "user_id": user_id,
                "emotionele_toestand": emotionele_toestand,
                "risico_score": risico_score,
                "plan_etf": plan_etf,
            },
        )

    async def run_etf_uitleg_workflow(
        self,
        etf_ticker: str,
        etf_naam: str,
        ter: str,
        spreiding: int,
        beginner_score: int,
        user_ervaring: str = "beginner",
    ) -> OrchestratorResult:
        """Workflow: begrijpelijke ETF-uitleg genereren."""
        steps = [
            OrchestratorStep(
                agent_name="etf_adviseur",
                description="Begrijpelijke ETF-uitleg genereren",
                context_key="etf_uitleg",
            ),
        ]
        return await self.run_workflow(
            workflow_name="etf_uitleg",
            steps=steps,
            initial_input=(
                f"Leg {etf_ticker} ({etf_naam}) uit aan een {user_ervaring}. "
                f"TER: {ter}%, spreiding: {spreiding} bedrijven, "
                f"beginner-score: {beginner_score}/100."
            ),
            shared_context={
                "etf_ticker": etf_ticker,
                "ter": ter,
                "spreiding": spreiding,
                "beginner_score": beginner_score,
            },
        )

    async def run_plan_generatie_workflow(
        self,
        user_id: str,
        etf_ticker: str,
        maandelijks_bedrag: str,
        horizon_jaren: int,
        risico_score: int,
        beleggingsdoel: str,
    ) -> OrchestratorResult:
        """Workflow: beleggingsplan genereren → gedragscoach voegt motivatie toe."""
        steps = [
            OrchestratorStep(
                agent_name="plan_generator",
                description="Beleggingsplan opstellen",
                context_key="plan_tekst",
            ),
            OrchestratorStep(
                agent_name="gedragscoach",
                description="Motiverende afsluiting toevoegen",
                context_key="motivatie_tekst",
                required=False,
            ),
        ]
        return await self.run_workflow(
            workflow_name="plan_generatie",
            steps=steps,
            initial_input=(
                f"Maak een beleggingsplan voor iemand met risicoscore {risico_score}/100. "
                f"Gekozen ETF: {etf_ticker}. Maandelijks: €{maandelijks_bedrag}. "
                f"Horizon: {horizon_jaren} jaar. Doel: {beleggingsdoel}."
            ),
            shared_context={
                "user_id": user_id,
                "etf_ticker": etf_ticker,
                "maandelijks_bedrag": maandelijks_bedrag,
                "horizon_jaren": horizon_jaren,
                "beleggingsdoel": beleggingsdoel,
            },
        )

    async def run_leer_module_workflow(
        self,
        concept: str,
        user_ervaring: str = "beginner",
    ) -> OrchestratorResult:
        """Workflow: leermodule genereren voor een beleggingsconcept."""
        steps = [
            OrchestratorStep(
                agent_name="leer_assistent",
                description=f"Concept '{concept}' uitleggen",
                context_key="leer_content",
            ),
        ]
        return await self.run_workflow(
            workflow_name="leer_module",
            steps=steps,
            initial_input=f"Leg '{concept}' uit voor een {user_ervaring}.",
            shared_context={"concept": concept, "user_ervaring": user_ervaring},
        )


_orchestrator: AgentOrchestrator | None = None


def get_orchestrator() -> AgentOrchestrator:
    """Geef de singleton AgentOrchestrator terug."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = AgentOrchestrator()
    return _orchestrator
