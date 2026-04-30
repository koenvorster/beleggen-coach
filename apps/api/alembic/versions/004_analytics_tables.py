"""004 — analytics tabellen aanmaken (ETF prijsdata, metrics, Fear&Greed, platform stats).

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
    """Maak Fase 13 analytics tabellen aan."""
    
    # ETF dagelijkse koersen (yfinance historische data)
    op.execute("""
        CREATE TABLE IF NOT EXISTS etf_prices (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            etf_isin VARCHAR(12) NOT NULL,
            date DATE NOT NULL,
            open NUMERIC(10,4) NOT NULL,
            high NUMERIC(10,4) NOT NULL,
            low NUMERIC(10,4) NOT NULL,
            close NUMERIC(10,4) NOT NULL,
            volume INTEGER NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(etf_isin, date)
        )
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_etf_prices_etf_isin "
        "ON etf_prices (etf_isin)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_etf_prices_date "
        "ON etf_prices (date)"
    )

    # ETF berekende metrics (returns, volatility, Sharpe, drawdown)
    op.execute("""
        CREATE TABLE IF NOT EXISTS etf_metrics (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            etf_isin VARCHAR(12) NOT NULL UNIQUE,
            date DATE NOT NULL,
            return_1m NUMERIC(8,4),
            return_3m NUMERIC(8,4),
            return_ytd NUMERIC(8,4),
            return_1y NUMERIC(8,4),
            return_3y NUMERIC(8,4),
            return_5y NUMERIC(8,4),
            volatility_1y NUMERIC(6,4),
            volatility_3y NUMERIC(6,4),
            max_drawdown_1y NUMERIC(6,4),
            sharpe_ratio_1y NUMERIC(6,4),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_etf_metrics_etf_isin "
        "ON etf_metrics (etf_isin)"
    )

    # Fear & Greed Index (dagelijks)
    op.execute("""
        CREATE TABLE IF NOT EXISTS fear_greed_index (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            date DATE NOT NULL UNIQUE,
            score INTEGER NOT NULL,
            vix_level NUMERIC(6,2),
            momentum NUMERIC(6,4),
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_fear_greed_index_date "
        "ON fear_greed_index (date)"
    )

    # Platform statistieken (anoniem, dagelijks snapshot)
    op.execute("""
        CREATE TABLE IF NOT EXISTS platform_stats (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            date DATE NOT NULL UNIQUE,
            total_users INTEGER NOT NULL,
            active_users INTEGER NOT NULL,
            avg_monthly_investment NUMERIC(10,2) NOT NULL,
            avg_investment_horizon_years NUMERIC(5,2) NOT NULL,
            avg_streak_days INTEGER NOT NULL,
            top_etf_isins JSONB NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_platform_stats_date "
        "ON platform_stats (date)"
    )


def downgrade() -> None:
    """Verwijder Fase 13 analytics tabellen."""
    op.execute("DROP TABLE IF EXISTS platform_stats")
    op.execute("DROP TABLE IF EXISTS fear_greed_index")
    op.execute("DROP TABLE IF EXISTS etf_metrics")
    op.execute("DROP TABLE IF EXISTS etf_prices")

