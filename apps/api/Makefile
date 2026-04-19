.PHONY: migrate seed dev test lint

migrate:
	uv run alembic upgrade head

seed:
	uv run python -m src.scripts.seed_data

dev:
	uv run uvicorn src.main:app --reload --port 8000

test:
	uv run pytest

lint:
	uv run ruff check src/
