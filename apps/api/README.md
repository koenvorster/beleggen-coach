# Beleggingsapp API

FastAPI backend voor de AI-beleggingscoach.

## Vereisten

- Python 3.12+
- [uv](https://github.com/astral-sh/uv)
- PostgreSQL 16
- Redis

## Installatie

```bash
uv sync
cp .env.example .env   # pas DATABASE_URL, REDIS_URL, etc. aan
```

## Database setup

```bash
uv run alembic upgrade head
uv run python -m src.scripts.seed_data
```

Of via Make:

```bash
make migrate
make seed
```

## Lokaal starten

```bash
make dev
# of
uv run uvicorn src.main:app --reload --port 8000
```

## Testen

```bash
make test
```

## Migraties

Nieuwe migratie aanmaken:

```bash
uv run alembic revision -m "beschrijving_van_wijziging"
```

Huidige staat bekijken:

```bash
uv run alembic current
uv run alembic history
```
