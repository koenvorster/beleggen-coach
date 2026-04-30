

# Fase 15: Quick Reference Guide

## What Changed?

**Before**: ETF router used hardcoded mock data  
**Now**: Database-backed with DDD aggregate pattern & proper filtering

---

## Using ETF Domain Objects

### Creating an ETF Product

```python
from src.domain.value_objects import ISIN, TER, ETFScore, DividendYield
from src.domain.etf import ETFProduct
from datetime import date

product = ETFProduct(
    isin=ISIN(code="IE00B4L5Y983"),
    name="iShares Core MSCI World",
    description="Global equity ETF",
    category="equity",
    ter=TER(value=0.0020),           # 0.20%
    risk_score=ETFScore.from_level(5),  # "Moderate"
    dividend_yield=DividendYield(value=1.8),
    inception_date=date(2009, 6, 1),
    is_accumulating=True,
    benchmark="MSCI World",
)

# Domain methods
is_suitable = product.is_suitable_for(investor_profile)
annual_fee = product.annual_fee_on(investment_amount)  # Geld value object
is_cheap = product.is_cheap  # TER < 0.25%
age = product.age_years
```

### Working with Value Objects

```python
from src.domain.value_objects import ISIN, TER, ETFScore

# ISIN validation
isin = ISIN(code="IE00B4L5Y983")  # ✓ Valid
isin = ISIN(code="invalid")        # ✗ ValidationError

# TER (expressed as decimal 0.0-1.0)
ter = TER(value=0.0020)  # 0.20%
str(ter)                 # "0.20%"
float(ter)               # 0.002

# ETFScore
score = ETFScore.from_level(3)  # "Conservative-Moderate"
score.level                      # 3
score.label                      # "Conservative-Moderate"
```

---

## Using the ETF Service

```python
from src.services import etf_service
from sqlalchemy.ext.asyncio import AsyncSession

# List with filters
etfs, total = await etf_service.list_etfs(
    db,
    search="world",          # search name/ISIN
    category="equity",
    min_ter=0.0,
    max_ter=0.30,
    risk_level=5,
    limit=20,
    offset=0,
)

# Get single ETF
etf = await etf_service.get_etf_by_isin(db, "IE00B4L5Y983")

# Get similar ETFs
similar = await etf_service.get_similar_etfs(db, "IE00B4L5Y983", limit=5)

# Get filter facets
facets = await etf_service.get_facets(db)
# facets = {"categories": ["equity", "bond"], "risk_levels": [1,2,3,...]}

# Convert ORM → DDD Aggregate
aggregate = etf_service.etf_to_aggregate(etf_orm_model)
```

---

## Router Endpoints

### GET /etfs
**List with filters & pagination**

```bash
# All ETFs
GET /etfs

# Filter by category
GET /etfs?category=equity

# Search
GET /etfs?search=world

# Filter by TER
GET /etfs?max_ter=0.25

# Pagination
GET /etfs?limit=10&offset=20

# Combined
GET /etfs?search=msci&category=equity&max_ter=0.30&limit=20
```

**Response**:
```json
{
  "etfs": [
    {
      "isin": "IE00B4L5Y983",
      "name": "iShares Core MSCI World",
      "ter": 0.2,
      "risk_level": 5,
      "risk_label": "Moderate",
      "category": "equity",
      ...
    }
  ],
  "count": 20,           // Count in this page
  "offset": 0,           // Pagination offset
  "limit": 20,           // Pagination limit
  "total": 250,          // Total count without pagination
  "facets": {            // For UI filter options
    "categories": [...],
    "risk_levels": [1,2,3,4,5,6,7]
  }
}
```

### GET /etfs/{isin}
**ETF detail with 3-5 similar ETFs**

```bash
GET /etfs/IE00B4L5Y983
```

**Response**:
```json
{
  "isin": "IE00B4L5Y983",
  "name": "iShares Core MSCI World",
  "ter": 0.2,
  "risk_level": 5,
  "risk_label": "Moderate",
  ...
  "similar_etfs": [
    { "isin": "IE00BK5BQT80", "name": "Vanguard FTSE All-World", ... },
    { "isin": "LU0274208692", "name": "Xtrackers MSCI World", ... },
    ...
  ]
}
```

### GET /etfs/{isin}/similar
**Similar ETFs only**

```bash
GET /etfs/IE00B4L5Y983/similar?limit=5
```

**Response**:
```json
[
  { "isin": "IE00BK5BQT80", "name": "Vanguard FTSE All-World", ... },
  { "isin": "LU0274208692", "name": "Xtrackers MSCI World", ... },
  ...
]
```

---

## Testing

### Unit Tests (No DB Required)

```bash
cd apps/api
uv run pytest tests/test_etfs_router.py::TestISINValueObject -v
uv run pytest tests/test_etfs_router.py::TestETFProductAggregate -v
```

### All Tests

```bash
cd apps/api
uv run pytest tests/test_etfs_router.py -v
```

### With Coverage

```bash
uv run pytest tests/test_etfs_router.py --cov=src --cov-report=term-missing
```

---

## Database Setup

### Run Migrations

```bash
cd apps/api
uv run alembic upgrade head
```

### Check Migration Status

```bash
uv run alembic current
uv run alembic history
```

---

## Common Patterns

### Check if ETF is Suitable for Investor

```python
from src.domain.value_objects import BeleggingsProfiel, Geld
from decimal import Decimal

investor = BeleggingsProfiel(
    risico="matig",
    horizon_jaren=10,
    maandbudget=Geld(bedrag=Decimal("500.00")),
)

if etf_product.is_suitable_for(investor):
    print("✓ Suitable for this investor")
else:
    print("✗ Not suitable (risk too high or horizon too short)")
```

### Calculate Annual Costs

```python
from src.domain.value_objects import Geld
from decimal import Decimal

investment = Geld(bedrag=Decimal("10000.00"))
annual_fee = etf_product.annual_fee_on(investment)
print(f"Annual fee: {annual_fee}")  # € 20.00 for 0.20% TER
```

### Filter Cheap ETFs

```python
cheap_etfs = [etf for etf in all_etfs if etf.is_cheap]
# Returns ETFs with TER < 0.25%
```

---

## Error Handling

### ETF Not Found

```python
from fastapi import HTTPException, status

etf = await etf_service.get_etf_by_isin(db, "INVALID123")
if not etf:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="ETF not found"
    )
```

### Invalid Value Objects

```python
from pydantic import ValidationError

try:
    isin = ISIN(code="INVALID")
except ValidationError as e:
    print(f"ISIN validation failed: {e}")

try:
    ter = TER(value=1.5)  # Must be 0.0-1.0
except ValidationError as e:
    print(f"TER validation failed: {e}")
```

---

## Performance Tips

1. **Caching**: Results cached for 1-6 hours
2. **Pagination**: Always use `limit` (max 100) and `offset`
3. **Indexes**: Database has indexes on:
   - `isin` (unique, fast lookup)
   - `category`, `risk_level`, `ter` (filtering)
   - `name` (text search)
4. **Lazy Loading**: Similar ETFs fetched only in `/detail` endpoint

---

## Migration Checklist

When deploying Fase 15:

- [ ] Database running (PostgreSQL 16)
- [ ] Run: `uv run alembic upgrade head`
- [ ] Verify indexes created: `\di etfs` in psql
- [ ] Seed ETFs from catalog (if empty)
- [ ] Run tests: `uv run pytest tests/test_etfs_router.py -v`
- [ ] Test endpoints with curl/Postman
- [ ] Deploy API
- [ ] Monitor logs for cache hit rates

---

## File Structure

```
apps/api/
├── src/
│   ├── domain/
│   │   ├── etf.py                 # ETFProduct aggregate (NEW)
│   │   └── value_objects.py       # ISIN, TER, ETFScore, etc. (UPDATED)
│   ├── routers/
│   │   └── etfs.py                # Router endpoints (REWRITTEN)
│   ├── services/
│   │   └── etf_service.py         # Service layer (UPDATED)
│   └── schemas.py                 # Response DTOs (UPDATED)
├── alembic/versions/
│   └── 005_add_etf_indexes.py     # Database indexes (NEW)
└── tests/
    └── test_etfs_router.py        # Comprehensive tests (NEW)
```

---

## Next Steps

1. **Dividend Yield**: Add `dividend_yield` column to ETF model
2. **Advanced Search**: Elasticsearch integration for large catalogs
3. **Performance**: Load testing with wrk2 or vegeta
4. **Analytics**: Track most viewed/recommended ETFs
5. **Recommendations**: ML-based ETF suggestions per investor profile
