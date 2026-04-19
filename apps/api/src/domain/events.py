"""Domain Events — immutable records van domeingebeurtenissen."""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


class DomainEvent(BaseModel):
    """Basisklasse voor alle domain events."""
    event_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    occurred_at: datetime = Field(default_factory=_now_utc)
    aggregate_id: uuid.UUID

    model_config = {"frozen": True}

    @property
    def event_type(self) -> str:
        return self.__class__.__name__


class GebruikerGeregistreerd(DomainEvent):
    """Een nieuwe gebruiker heeft zich geregistreerd."""
    email: str
    naam: str


class ProfielAangemaakt(DomainEvent):
    """Een beleggersprofiel is aangemaakt na de onboarding."""
    risico: str
    horizon_jaren: int
    maandbudget_eur: float


class PlanAangemaakt(DomainEvent):
    """Een beleggingsplan is aangemaakt voor een gebruiker."""
    user_id: uuid.UUID
    maandbedrag_eur: float
    etf_isins: list[str]


class CheckInVoltooid(DomainEvent):
    """Een maandelijkse check-in is voltooid."""
    user_id: uuid.UUID
    maand: str  # "YYYY-MM"
    heeft_belegd: bool
    emotionele_staat: str


class PortfolioPositieToegevoegd(DomainEvent):
    """Een ETF-positie is toegevoegd aan het portfolio."""
    user_id: uuid.UUID
    etf_isin: str
    etf_ticker: str
    aandelen: float
    aankoopprijs_eur: float


class DomainEventBus:
    """Eenvoudige in-memory event bus voor domain events.

    In productie kan dit worden vervangen door een echte event broker (Redis Streams, etc.).
    """

    def __init__(self) -> None:
        self._handlers: dict[str, list[Any]] = {}
        self._published: list[DomainEvent] = []

    def subscribe(self, event_type: type[DomainEvent], handler: Any) -> None:
        """Registreer een handler voor een event type.

        Args:
            event_type: Het event type om op te abonneren.
            handler: Async callable die het event verwerkt.
        """
        key = event_type.__name__
        self._handlers.setdefault(key, []).append(handler)

    async def publish(self, event: DomainEvent) -> None:
        """Publiceer een event naar alle geregistreerde handlers.

        Args:
            event: Het te publiceren domain event.
        """
        import logging
        logger = logging.getLogger(__name__)
        self._published.append(event)
        key = event.event_type
        for handler in self._handlers.get(key, []):
            try:
                await handler(event)
            except Exception as exc:
                logger.warning("Event handler fout voor %s: %s", key, exc)

    @property
    def published_events(self) -> list[DomainEvent]:
        """Geef alle gepubliceerde events terug (nuttig voor tests)."""
        return list(self._published)


# Singleton event bus — kan worden overschreven in tests
event_bus = DomainEventBus()
