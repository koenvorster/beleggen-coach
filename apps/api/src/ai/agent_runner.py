"""
Beleggingsapp Agent Runner
Laadt runtime-agents vanuit YAML-configuraties en voert ze uit via Ollama.
"""
import logging
from pathlib import Path
from typing import Any

import yaml

from .client import OllamaClient, get_client
from .prompt_iterator import PromptIterator

logger = logging.getLogger(__name__)

_API_ROOT = Path(__file__).parent.parent.parent  # apps/api/
AGENTS_DIR = _API_ROOT / "ai_agents"
PROMPTS_DIR = _API_ROOT / "prompts"


class Agent:
    """Vertegenwoordigt een geconfigureerde runtime AI-agent."""

    def __init__(self, config: dict[str, Any]):
        self.name: str = config["name"]
        self.model: str = config.get("model", "llama3")
        self.temperature: float = config.get("temperature", 0.7)
        self.max_tokens: int = config.get("max_tokens", 1024)
        self.system_prompt: str = self._load_text(config.get("system_prompt_ref", ""))
        self.preprompt: str = self._load_text(config.get("preprompt_ref", ""))

    def _load_text(self, ref: str) -> str:
        """Laad een tekstbestand vanuit de prompts map."""
        if not ref:
            return ""
        path = _API_ROOT / ref
        if not path.exists():
            logger.warning("Prompt bestand niet gevonden: %s", path)
            return ""
        return path.read_text(encoding="utf-8")

    async def run(
        self,
        user_input: str,
        context: dict[str, Any] | None = None,
        client: OllamaClient | None = None,
    ) -> tuple[str, str]:
        """
        Voer de agent uit met de gegeven input.

        Args:
            user_input: De invoer van de gebruiker
            context: Variabelen voor preprompt-interpolatie ({variabele})
            client: Optioneel een aangepaste Ollama client

        Returns:
            Tuple van (antwoord, interaction_id)
        """
        if client is None:
            client = get_client()

        preprompt = self.preprompt
        if context and preprompt:
            for key, value in context.items():
                preprompt = preprompt.replace(f"{{{key}}}", str(value))

        full_prompt = f"{preprompt}\n\n{user_input}" if preprompt else user_input

        logger.info("Agent '%s' gestart (model: %s)", self.name, self.model)

        response = await client.generate(
            prompt=full_prompt,
            model=self.model,
            system=self.system_prompt,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
        )

        logger.info("Agent '%s' klaar (%d tekens)", self.name, len(response))

        iterator = PromptIterator(self.name)
        interaction_id = iterator.log_interaction(
            user_input=user_input,
            agent_output=response,
            metadata={"context": context or {}, "model": self.model},
        )

        return response, interaction_id

    async def chat(
        self,
        history: list[dict[str, str]],
        client: OllamaClient | None = None,
    ) -> str:
        """
        Multi-turn gesprek met de agent.

        Args:
            history: Eerdere berichten in chat-formaat
            client: Optioneel een aangepaste Ollama client

        Returns:
            Het antwoord van de agent
        """
        if client is None:
            client = get_client()

        messages: list[dict[str, str]] = []
        if self.system_prompt:
            messages.append({"role": "system", "content": self.system_prompt})
        messages.extend(history)

        return await client.chat(
            messages=messages,
            model=self.model,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
        )


class AgentRunner:
    """Laadt en beheert alle geconfigureerde runtime-agents."""

    def __init__(self, agents_dir: Path = AGENTS_DIR):
        self.agents_dir = agents_dir
        self._agents: dict[str, Agent] = {}
        self._load_agents()

    def _load_agents(self) -> None:
        """Laad alle agent-configuraties vanuit de agents map."""
        if not self.agents_dir.exists():
            logger.warning("AI agents map niet gevonden: %s", self.agents_dir)
            return
        for yaml_file in self.agents_dir.glob("*.yml"):
            try:
                config = yaml.safe_load(yaml_file.read_text(encoding="utf-8"))
                agent = Agent(config)
                self._agents[agent.name] = agent
                logger.info("Agent geladen: %s (model: %s)", agent.name, agent.model)
            except Exception as exc:
                logger.error("Fout bij laden agent %s: %s", yaml_file.name, exc)

    def get(self, name: str) -> Agent | None:
        """Geef een agent op naam terug."""
        return self._agents.get(name)

    def list_agents(self) -> list[str]:
        """Geef een lijst van beschikbare agent-namen terug."""
        return list(self._agents.keys())

    async def run_agent(
        self,
        agent_name: str,
        user_input: str,
        context: dict[str, Any] | None = None,
        client: OllamaClient | None = None,
    ) -> tuple[str, str]:
        """
        Voer een specifieke agent uit.

        Raises:
            ValueError: Als de agent niet gevonden wordt
        """
        agent = self.get(agent_name)
        if agent is None:
            raise ValueError(
                f"Agent '{agent_name}' niet gevonden. Beschikbaar: {self.list_agents()}"
            )
        return await agent.run(user_input, context=context, client=client)


_runner: AgentRunner | None = None


def get_runner() -> AgentRunner:
    """Geef de singleton AgentRunner terug."""
    global _runner
    if _runner is None:
        _runner = AgentRunner()
    return _runner
