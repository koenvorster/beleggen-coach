"""004 — analytics tabellen aanmaken (ETF prijsdata, metrics, platform events).

Revision ID: 004
Revises: 003
Create Date: 2026-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Maak analytics tabellen aan: etf_prices, etf_metrics en platform_events."""
    op.execute("""
        CREATE TABLE IF NOT EXISTS etf_prices (
            id BIGSERIAL,
            ticker VARCHAR(10) NOT NULL,
            datum DATE NOT NULL,
            open NUMERIC(16,4),
            high NUMERIC(16,4),
            low NUMERIC(16,4),
            close NUMERIC(16,4) NOT NULL,
            volume BIGINT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (ticker, datum)
        )
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_etf_prices_ticker_datum "
        "ON etf_prices (ticker, datum DESC)"
    )

    op.execute("""
        CREATE TABLE IF NOT EXISTS etf_metrics (
            ticker VARCHAR(10) PRIMARY KEY,
            naam VARCHAR(255),
            return_1m NUMERIC(8,4),
            return_3m NUMERIC(8,4),
            return_ytd NUMERIC(8,4),
            return_1y NUMERIC(8,4),
            return_3y NUMERIC(8,4),
            return_5y NUMERIC(8,4),
            volatility_1y NUMERIC(8,4),
            sharpe_1y NUMERIC(8,4),
            max_drawdown NUMERIC(8,4),
            last_price NUMERIC(16,4),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS platform_events (
            id BIGSERIAL PRIMARY KEY,
            event_type VARCHAR(50) NOT NULL,
            event_data JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_platform_events_type "
        "ON platform_events (event_type, created_at DESC)"
    )


def downgrade() -> None:
    """Verwijder analytics tabellen."""
    op.execute("DROP TABLE IF EXISTS platform_events")
    op.execute("DROP TABLE IF EXISTS etf_metrics")
    op.execute("DROP TABLE IF EXISTS etf_prices")
