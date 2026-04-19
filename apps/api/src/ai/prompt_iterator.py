"""
Beleggingsapp Prompt Iteratie Systeem
Beheert prompt-versies en feedback voor continue verbetering van runtime-agents.
"""
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

logger = logging.getLogger(__name__)

_API_ROOT = Path(__file__).parent.parent.parent  # apps/api/
PROMPTS_DIR = _API_ROOT / "prompts"
LOGS_DIR = _API_ROOT / "logs"


class PromptIterator:
    """
    Beheert prompt-iteraties en feedback voor één agent.

    Gebruik dit systeem om prompts systematisch te verbeteren
    op basis van echte interacties en feedback-scores.
    """

    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.iterations_file = PROMPTS_DIR / "preprompts" / f"{agent_name}_iterations.yml"
        self.log_dir = LOGS_DIR / agent_name
        self.log_dir.mkdir(parents=True, exist_ok=True)

    def get_current_version(self) -> str:
        """Geef de huidige actieve prompt-versie terug."""
        if not self.iterations_file.exists():
            return "1.0"
        data = yaml.safe_load(self.iterations_file.read_text(encoding="utf-8"))
        for iteration in reversed(data.get("iterations", [])):
            if iteration.get("status") == "actief":
                return iteration["version"]
        return "1.0"

    def log_interaction(
        self,
        user_input: str,
        agent_output: str,
        metadata: dict[str, Any] | None = None,
    ) -> str:
        """
        Log een interactie voor latere analyse.

        Returns:
            De ID van de opgeslagen interactie
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        safe_ts = timestamp.replace(":", "-").replace("+", "").replace(".", "-")
        interaction_id = f"{self.agent_name}_{safe_ts}"

        entry = {
            "id": interaction_id,
            "timestamp": timestamp,
            "prompt_version": self.get_current_version(),
            "user_input": user_input,
            "agent_output": agent_output,
            "metadata": metadata or {},
            "feedback": None,
        }

        log_file = self.log_dir / f"{interaction_id}.json"
        log_file.write_text(json.dumps(entry, ensure_ascii=False, indent=2), encoding="utf-8")

        logger.debug("Interactie gelogd: %s", interaction_id)
        return interaction_id

    def add_feedback(self, interaction_id: str, rating: int, notes: str = "") -> bool:
        """
        Voeg feedback toe aan een gelogde interactie.

        Args:
            rating: Beoordeling 1–5
        """
        log_file = self.log_dir / f"{interaction_id}.json"
        if not log_file.exists():
            logger.warning("Interactie niet gevonden: %s", interaction_id)
            return False

        entry = json.loads(log_file.read_text(encoding="utf-8"))
        entry["feedback"] = {
            "rating": rating,
            "notes": notes,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        log_file.write_text(json.dumps(entry, ensure_ascii=False, indent=2), encoding="utf-8")
        return True

    def analyse_feedback(self) -> dict[str, Any]:
        """Analyseer alle feedback voor deze agent."""
        log_files = list(self.log_dir.glob("*.json"))
        ratings: list[int] = []
        low_rated: list[dict] = []

        for log_file in log_files:
            entry = json.loads(log_file.read_text(encoding="utf-8"))
            feedback = entry.get("feedback")
            if feedback and feedback.get("rating") is not None:
                rating = feedback["rating"]
                ratings.append(rating)
                if rating <= 2:
                    low_rated.append(entry)

        if not ratings:
            return {"status": "geen_feedback", "totaal_interacties": len(log_files)}

        return {
            "agent": self.agent_name,
            "prompt_versie": self.get_current_version(),
            "totaal_interacties": len(log_files),
            "beoordeelde_interacties": len(ratings),
            "gemiddelde_score": round(sum(ratings) / len(ratings), 2),
            "lage_scores": len(low_rated),
        }
