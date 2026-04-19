"""Unit tests voor domain events en event bus."""
import uuid
import pytest

from ..events import DomainEventBus, PlanAangemaakt, CheckInVoltooid


@pytest.mark.asyncio
async def test_event_bus_publiceert_naar_handler():
    bus = DomainEventBus()
    ontvangen = []

    async def handler(event: PlanAangemaakt) -> None:
        ontvangen.append(event)

    bus.subscribe(PlanAangemaakt, handler)

    event = PlanAangemaakt(
        aggregate_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        maandbedrag_eur=200.0,
        etf_isins=["IE00B4L5Y983"],
    )
    await bus.publish(event)
    assert len(ontvangen) == 1
    assert ontvangen[0].event_type == "PlanAangemaakt"


@pytest.mark.asyncio
async def test_event_bus_handler_fout_crasht_niet():
    bus = DomainEventBus()

    async def kapotte_handler(event: PlanAangemaakt) -> None:
        raise RuntimeError("Opzettelijke fout")

    bus.subscribe(PlanAangemaakt, kapotte_handler)
    # Mag NIET crashen
    await bus.publish(PlanAangemaakt(
        aggregate_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        maandbedrag_eur=100.0,
        etf_isins=[],
    ))
