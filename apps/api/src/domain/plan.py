"""Plan domain entity — beleggingsplan business logica."""
from __future__ import annotations
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone

from .value_objects import BeleggingsProfiel, Geld


@dataclass
class PlanEntity:
    """Domain entity voor een beleggingsplan.

    Attrs:
        id: Uniek plan-ID.
        user_id: Eigenaar van het plan.
        profiel: Het bijbehorende beleggersprofiel.
        etf_allocatie: Dict van ISIN → gewicht (som moet 1.0 zijn).
        motivatie: Tekstuele motivatie voor het plan.
        aangemaakt_op: Aanmaakdatum.
    """
    id: uuid.UUID
    user_id: uuid.UUID
    profiel: BeleggingsProfiel
    etf_allocatie: dict[str, float]  # ISIN → gewicht
    motivatie: str
    aangemaakt_op: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def valideer_allocatie(self) -> bool:
        """Controleer of de allocatiegewichten optellen tot (bijna) 1.0.

        Returns:
            True als de allocatie geldig is.
        """
        if not self.etf_allocatie:
            return False
        totaal = sum(self.etf_allocatie.values())
        return abs(totaal - 1.0) < 0.001

    def maandelijks_per_etf(self) -> dict[str, Geld]:
        """Bereken het maandelijks te beleggen bedrag per ETF.

        Returns:
            Dict van ISIN → Geld bedrag per maand.
        """
        return {
            isin: self.profiel.maandbudget * gewicht
            for isin, gewicht in self.etf_allocatie.items()
        }

    def geprojecteerde_eindwaarde(self, rendement: float = 0.06) -> Geld:
        """Bereken de verwachte eindwaarde van het totale plan.

        Args:
            rendement: Jaarlijks rendement als decimaal.

        Returns:
            Geprojecteerde eindwaarde.
        """
        return self.profiel.geprojecteerde_waarde(rendement)
