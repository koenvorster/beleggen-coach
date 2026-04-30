"""Background scheduler voor data ingestion jobs."""
import asyncio
from datetime import datetime, time
from typing import Any

import structlog
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from .config import settings
from .services.analytics_service import run_daily_analytics_job

logger = structlog.get_logger(__name__)

scheduler: AsyncIOScheduler | None = None


async def init_scheduler():
    """Initialiseer de AsyncIOScheduler met dagelijkse analytics jobs."""
    global scheduler
    
    scheduler = AsyncIOScheduler()
    
    # Dagelijkse analytics job om 17:30 CET (15:30 UTC in winter)
    # Voor dev: elke minuut (om snel te testen)
    if settings.environment == "production":
        scheduler.add_job(
            _run_analytics_wrapper,
            CronTrigger(hour=15, minute=30),
            id="daily_analytics",
            name="Daily ETF metrics & Fear/Greed update",
            max_instances=1,
        )
    else:
        scheduler.add_job(
            _run_analytics_wrapper,
            CronTrigger(minute="*/5"),  # Elke 5 minuten in dev
            id="daily_analytics",
            name="Daily ETF metrics & Fear/Greed update (dev)",
            max_instances=1,
        )
    
    scheduler.start()
    logger.info("scheduler_started", jobs=len(scheduler.get_jobs()))


async def _run_analytics_wrapper():
    """Wrapper om analytics job in dev mode uit te voeren."""
    try:
        logger.info("analytics_job_started")
        
        # Zelf een session maken omdat dit async context is
        engine = create_async_engine(settings.database_url, echo=False)
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        async with async_session() as session:
            await run_daily_analytics_job(session)
        
        await engine.dispose()
        logger.info("analytics_job_completed")
    except Exception as e:
        logger.error("analytics_job_failed", error=str(e), exc_info=e)


async def shutdown_scheduler():
    """Sluit de scheduler af bij applicatie-shutdown."""
    global scheduler
    if scheduler:
        scheduler.shutdown()
        logger.info("scheduler_shutdown")
