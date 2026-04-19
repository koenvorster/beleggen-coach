"""Alembic env.py — async setup voor PostgreSQL + asyncpg."""
import asyncio
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

# Importeer Base + alle modellen zodat target_metadata volledig is
from src.database import Base
import src.models  # noqa: F401 — registreert alle tabellen op Base.metadata

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Lees DATABASE_URL uit omgeving; fallback naar settings default
_db_url = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://beleggingsapp:beleggingsapp_dev@localhost:5432/beleggingsapp",
)
config.set_main_option("sqlalchemy.url", _db_url)


def run_migrations_offline() -> None:
    """Voer migraties uit in 'offline' modus (geen echte DB-verbinding).

    Genereert SQL-statements naar stdout of bestand.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Voer migraties uit op een bestaande verbinding."""
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Maak een async engine en voer migraties uit."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    """Voer migraties uit in 'online' modus via asyncio."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
