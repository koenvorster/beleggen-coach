"""ETF service — business logic voor ETF-opvragen, filtering en aggregate constructie."""
import structlog
from typing import Optional

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import ETF
from ..schemas import ETFCreate
from ..domain.etf import ETFProduct
from ..domain.value_objects import DividendYield, ETFScore, ISIN, TER

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
) -> tuple[list[ETF], int]:
    """Haal een gefilterde lijst van ETFs op uit de database.

    Args:
        db: Async database sessie.
        search: Zoekterm voor naam of ISIN (case-insensitief).
        category: Filter op categorie (equity, bond, mixed, real_estate, commodity).
        min_ter: Minimum Total Expense Ratio.
        max_ter: Maximum Total Expense Ratio.
        risk_level: Filter op risicoscore (1-7).
        limit: Maximum aantal resultaten (1-100).
        offset: Aantal resultaten om over te slaan (paginering).

    Returns:
        Tuple van (gefilterde ETF objecten, totaal count zonder paginering).
    """
    query = select(ETF)

    if search:
        term = f"%{search.lower()}%"
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

    # Count totaal VOOR paginering
    count_query = select(func.count()).select_from(ETF).where(query.whereclause is not None)
    count_result = await db.execute(count_query)
    total_count = count_result.scalar() or 0

    # Apply paginering
    query = query.order_by(ETF.name).offset(offset).limit(limit)
    result = await db.execute(query)
    etfs = list(result.scalars().all())
    
    logger.debug(
        "etfs_listed",
        count=len(etfs),
        total=total_count,
        search=search,
        category=category,
    )
    
    return etfs, total_count


async def get_etf_by_isin(db: AsyncSession, isin: str) -> Optional[ETF]:
    """Haal één ETF op op basis van ISIN.

    Args:
        db: Async database sessie.
        isin: De ISIN-code van het ETF.

    Returns:
        Het ETF object of None als niet gevonden.
    """
    etf = await db.scalar(select(ETF).where(ETF.isin == isin.upper()))
    if etf:
        logger.debug("etf_found", isin=isin.upper())
    return etf


async def get_similar_etfs(
    db: AsyncSession,
    isin: str,
    limit: int = 5,
) -> list[ETF]:
    """Haal vergelijkbare ETFs op (dezelfde categorie/risicoscore, andere ISIN).
    
    Args:
        db: Async database sessie.
        isin: ISIN van het referentie-ETF.
        limit: Maximaal aantal vergelijkbare ETFs.
        
    Returns:
        Lijst van vergelijkbare ETF objecten.
    """
    # Haal eerst het referentie-ETF op
    reference = await get_etf_by_isin(db, isin)
    if not reference:
        return []
    
    # Zoek ETFs met dezelfde categorie en soortgelijk risico
    query = select(ETF).where(
        ETF.isin != isin.upper(),
        ETF.category == reference.category,
        # Risico-score mag max 1 niveau verschillen
        ETF.risk_level.between(
            max(1, reference.risk_level - 1),
            min(7, reference.risk_level + 1),
        ),
    ).order_by(ETF.ter.asc()).limit(limit)
    
    result = await db.execute(query)
    similar = list(result.scalars().all())
    
    logger.debug(
        "similar_etfs_found",
        reference_isin=isin.upper(),
        similar_count=len(similar),
    )
    
    return similar


async def get_facets(db: AsyncSession) -> dict:
    """Haal faceten op voor filtering (categorieën, risicoscores).
    
    Args:
        db: Async database sessie.
        
    Returns:
        Dict met beschikbare categorieën en risicoscores.
    """
    # Haal unieke categorieën op
    categories_query = select(ETF.category.distinct()).order_by(ETF.category)
    categories_result = await db.execute(categories_query)
    categories = [row[0] for row in categories_result.fetchall() if row[0]]
    
    # Haal unieke risicoscores op
    risk_levels_query = select(ETF.risk_level.distinct()).order_by(ETF.risk_level)
    risk_levels_result = await db.execute(risk_levels_query)
    risk_levels = sorted([row[0] for row in risk_levels_result.fetchall() if row[0]])
    
    return {
        "categories": categories,
        "risk_levels": risk_levels,
    }


def etf_to_aggregate(etf: ETF) -> ETFProduct:
    """Converteer ORM-model naar DDD aggregate root.
    
    Args:
        etf: SQLAlchemy ETF model instance.
        
    Returns:
        ETFProduct aggregate root.
    """
    return ETFProduct(
        isin=ISIN(code=etf.isin),
        name=etf.name,
        description=etf.description,
        category=etf.category,  # type: ignore
        ter=TER(value=etf.ter),
        risk_score=ETFScore.from_level(etf.risk_level),
        dividend_yield=DividendYield(value=0.0),  # TODO: add to model
        inception_date=etf.inception_date,
        is_accumulating=etf.is_accumulating,
        benchmark=etf.benchmark,
        currency=etf.currency,
        fund_size_m=etf.fund_size_m,
        ytd_return=etf.ytd_return,
        one_year_return=etf.one_year_return,
        three_year_return=etf.three_year_return,
        replication_method=etf.replication_method,
        domicile=etf.domicile,
    )


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
