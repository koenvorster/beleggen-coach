"""ETF router — endpoints voor ETF-catalogi, filtering en details."""
import structlog
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..cache import cache_get, cache_set
from ..database import get_db
from ..domain.value_objects import ETFScore
from ..schemas import ETFDetailResponse, ETFResponse, ListETFsResponse
from ..services import etf_service

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/etfs", tags=["etfs"])


@router.get(
    "",
    response_model=ListETFsResponse,
    summary="Haal gepagineerde lijst van ETFs op",
)
async def list_etfs(
    category: Optional[str] = Query(None, description="Filter op categorie (equity, bond, mixed, etc.)"),
    search: Optional[str] = Query(None, description="Zoek op ISIN of naam"),
    min_ter: Optional[float] = Query(None, ge=0, le=1, description="Minimum TER (0.0-1.0)"),
    max_ter: Optional[float] = Query(None, ge=0, le=1, description="Maximum TER (0.0-1.0)"),
    risk_level: Optional[int] = Query(None, ge=1, le=7, description="Filter op risicoscore (1-7)"),
    limit: int = Query(20, ge=1, le=100, description="Aantal resultaten per pagina"),
    offset: int = Query(0, ge=0, description="Paginering offset"),
    db: AsyncSession = Depends(get_db),
) -> ListETFsResponse:
    """Haal een gepagineerde, gefilterde lijst van ETFs op.

    Ondersteunt filtering op categorie, zoeken, TER en risicoscore.
    Inclusief facet-informatie voor beschikbare filter-opties.
    
    Cache: 1 uur (tot expiration)
    """
    # Valideer query params
    if limit < 1 or limit > 100:
        limit = 20
    if offset < 0:
        offset = 0

    # Cache key op basis van filters
    cache_key = f"etfs:list:{category}:{search}:{min_ter}:{max_ter}:{risk_level}:{limit}:{offset}"
    cached = await cache_get(cache_key)
    if cached is not None:
        logger.debug("cache_hit", key=cache_key)
        return cached

    # Query database
    etf_models, total_count = await etf_service.list_etfs(
        db,
        search=search,
        category=category,
        min_ter=min_ter,
        max_ter=max_ter,
        risk_level=risk_level,
        limit=limit,
        offset=offset,
    )

    # Haal facetten op (categorieën, risicoscores)
    facets = await etf_service.get_facets(db)

    # Converteer ORM-modellen naar response schemas
    etf_responses = [
        ETFResponse(
            isin=etf.isin,
            name=etf.name,
            description=etf.description,
            category=etf.category,
            ter=float(etf.ter),
            risk_level=etf.risk_level,
            risk_label=ETFScore.from_level(etf.risk_level).label,
            dividend_yield=0.0,  # TODO: add to model
            currency=etf.currency,
            benchmark=etf.benchmark,
            fund_size_m=etf.fund_size_m,
            ytd_return=etf.ytd_return,
            one_year_return=etf.one_year_return,
            three_year_return=etf.three_year_return,
            inception_date=etf.inception_date,
            is_accumulating=etf.is_accumulating,
            replication_method=etf.replication_method,
            domicile=etf.domicile,
        )
        for etf in etf_models
    ]

    result = ListETFsResponse(
        etfs=etf_responses,
        count=len(etf_responses),
        offset=offset,
        limit=limit,
        total=total_count,
        facets=facets,
    )

    # Cache voor 1 uur
    await cache_set(cache_key, result.model_dump(), ttl_seconds=3600)
    logger.info(
        "etfs_listed",
        count=len(etf_responses),
        total=total_count,
        category=category,
        search=search,
    )
    return result


@router.get(
    "/{isin}",
    response_model=ETFDetailResponse,
    summary="Haal ETF-details op met vergelijkbare ETFs",
)
async def get_etf(
    isin: str,
    db: AsyncSession = Depends(get_db),
) -> ETFDetailResponse:
    """Haal details van één ETF op met 3-5 vergelijkbare ETFs.
    
    Vergelijkbare ETFs zijn ETFs met dezelfde categorie en soortgelijk risico.
    
    Cache: 6 uur
    """
    cache_key = f"etfs:detail:{isin.upper()}"
    cached = await cache_get(cache_key)
    if cached is not None:
        logger.debug("cache_hit", key=cache_key)
        # Reconstruct response from cached dict
        return ETFDetailResponse(**cached)

    # Haal ETF op
    etf = await etf_service.get_etf_by_isin(db, isin)
    if not etf:
        logger.warning("etf_not_found", isin=isin.upper())
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ETF met ISIN '{isin}' niet gevonden.",
        )

    # Haal vergelijkbare ETFs op
    similar_models = await etf_service.get_similar_etfs(db, isin, limit=5)
    similar_responses = [
        ETFResponse(
            isin=s.isin,
            name=s.name,
            description=s.description,
            category=s.category,
            ter=float(s.ter),
            risk_level=s.risk_level,
            risk_label=ETFScore.from_level(s.risk_level).label,
            dividend_yield=0.0,  # TODO: add to model
            currency=s.currency,
            benchmark=s.benchmark,
            fund_size_m=s.fund_size_m,
            ytd_return=s.ytd_return,
            one_year_return=s.one_year_return,
            three_year_return=s.three_year_return,
            inception_date=s.inception_date,
            is_accumulating=s.is_accumulating,
            replication_method=s.replication_method,
            domicile=s.domicile,
        )
        for s in similar_models
    ]

    # Build response
    result = ETFDetailResponse(
        isin=etf.isin,
        name=etf.name,
        description=etf.description,
        category=etf.category,
        ter=float(etf.ter),
        risk_level=etf.risk_level,
        risk_label=ETFScore.from_level(etf.risk_level).label,
        dividend_yield=0.0,  # TODO: add to model
        currency=etf.currency,
        benchmark=etf.benchmark,
        fund_size_m=etf.fund_size_m,
        ytd_return=etf.ytd_return,
        one_year_return=etf.one_year_return,
        three_year_return=etf.three_year_return,
        inception_date=etf.inception_date,
        is_accumulating=etf.is_accumulating,
        replication_method=etf.replication_method,
        domicile=etf.domicile,
        similar_etfs=similar_responses,
    )

    # Cache voor 6 uur
    await cache_set(cache_key, result.model_dump(), ttl_seconds=21600)
    logger.info("etf_fetched", isin=isin.upper(), similar_count=len(similar_responses))
    return result


@router.get(
    "/{isin}/similar",
    response_model=list[ETFResponse],
    summary="Haal vergelijkbare ETFs op",
)
async def get_similar_etfs(
    isin: str,
    limit: int = Query(5, ge=1, le=20, description="Maximaal aantal vergelijkbare ETFs"),
    db: AsyncSession = Depends(get_db),
) -> list[ETFResponse]:
    """Haal 3-5 ETFs op vergelijkbaar aan het gegeven ETF.
    
    Vergelijkbare ETFs: dezelfde categorie, risicoscore max 1 niveau verschil.
    Gesorteerd op kosten (laagste TER eerst).
    
    Cache: 6 uur
    """
    cache_key = f"etfs:similar:{isin.upper()}:{limit}"
    cached = await cache_get(cache_key)
    if cached is not None:
        logger.debug("cache_hit", key=cache_key)
        return [ETFResponse(**item) for item in cached]

    # Valideer dat het ETF bestaat
    etf = await etf_service.get_etf_by_isin(db, isin)
    if not etf:
        logger.warning("etf_not_found", isin=isin.upper())
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ETF met ISIN '{isin}' niet gevonden.",
        )

    # Haal vergelijkbare op
    similar_models = await etf_service.get_similar_etfs(db, isin, limit=limit)
    similar_responses = [
        ETFResponse(
            isin=s.isin,
            name=s.name,
            description=s.description,
            category=s.category,
            ter=float(s.ter),
            risk_level=s.risk_level,
            risk_label=ETFScore.from_level(s.risk_level).label,
            dividend_yield=0.0,  # TODO: add to model
            currency=s.currency,
            benchmark=s.benchmark,
            fund_size_m=s.fund_size_m,
            ytd_return=s.ytd_return,
            one_year_return=s.one_year_return,
            three_year_return=s.three_year_return,
            inception_date=s.inception_date,
            is_accumulating=s.is_accumulating,
            replication_method=s.replication_method,
            domicile=s.domicile,
        )
        for s in similar_models
    ]

    # Cache voor 6 uur
    await cache_set(
        cache_key,
        [r.model_dump() for r in similar_responses],
        ttl_seconds=21600,
    )
    logger.info("similar_etfs_fetched", reference_isin=isin.upper(), count=len(similar_responses))
    return similar_responses

