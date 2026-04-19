"""ETF service — business logic voor ETF-opvragen en -aanmaken."""
import structlog
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import ETF
from ..schemas import ETFCreate

logger = structlog.get_logger(__name__)


async def list_etfs(
    db: AsyncSession,
    *,
    search: Optional[str] = None,
    category: Optional[str] = None,
    min_ter: Optional[float] = None,
    max_ter: Optional[float] = None,
    risk_level: Optional[int] = None,
    limit: int = 20,
    offset: int = 0,
) -> list[ETF]:
    """Haal een gefilterde lijst van ETFs op uit de database.

    Args:
        db: Async database sessie.
        search: Zoekterm voor naam of ISIN (case-insensitief).
        category: Filter op categorie (equity, bond, mixed, real_estate, commodity).
        min_ter: Minimum Total Expense Ratio.
        max_ter: Maximum Total Expense Ratio.
        risk_level: Filter op risicoscore (1-7).
        limit: Maximum aantal resultaten.
        offset: Aantal resultaten om over te slaan (paginering).

    Returns:
        Lijst van ETF objecten die overeenkomen met de filters.
    """
    query = select(ETF)

    if search:
        term = f"%{search.lower()}%"
        from sqlalchemy import or_, func
        query = query.where(
            or_(
                func.lower(ETF.name).like(term),
                func.lower(ETF.isin).like(term),
            )
        )
    if category:
        query = query.where(ETF.category == category)
    if min_ter is not None:
        query = query.where(ETF.ter >= min_ter)
    if max_ter is not None:
        query = query.where(ETF.ter <= max_ter)
    if risk_level is not None:
        query = query.where(ETF.risk_level == risk_level)

    query = query.order_by(ETF.name).offset(offset).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_etf_by_isin(db: AsyncSession, isin: str) -> Optional[ETF]:
    """Haal één ETF op op basis van ISIN.

    Args:
        db: Async database sessie.
        isin: De ISIN-code van het ETF.

    Returns:
        Het ETF object of None als niet gevonden.
    """
    return await db.scalar(select(ETF).where(ETF.isin == isin.upper()))


async def create_etf(db: AsyncSession, data: ETFCreate) -> ETF:
    """Maak een nieuw ETF aan in de database.

    Args:
        db: Async database sessie.
        data: Validated ETFCreate schema.

    Returns:
        Het aangemaakte ETF object.

    Raises:
        ValueError: Als een ETF met dit ISIN al bestaat.
    """
    existing = await get_etf_by_isin(db, data.isin)
    if existing:
        raise ValueError(f"ETF met ISIN '{data.isin}' bestaat al.")

    etf = ETF(
        isin=data.isin.upper(),
        name=data.name,
        description=data.description,
        category=data.category,
        ter=data.ter,
        risk_level=data.risk_level,
        currency=data.currency.upper(),
        benchmark=data.benchmark,
        fund_size_m=data.fund_size_m,
        ytd_return=data.ytd_return,
        one_year_return=data.one_year_return,
        three_year_return=data.three_year_return,
        inception_date=data.inception_date,
        is_accumulating=data.is_accumulating,
        replication_method=data.replication_method,
        domicile=data.domicile.upper(),
    )
    db.add(etf)
    await db.commit()
    await db.refresh(etf)
    logger.info("Nieuw ETF aangemaakt: %s (%s)", etf.name, etf.isin)
    return etf
