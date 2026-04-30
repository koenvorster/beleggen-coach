"""005 — ETF-indexes toevoegen voor filteren en zoeken.

Revision ID: 005
Revises: 004
Create Date: 2026-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Maak indexes aan voor ETF-filteren, zoeken en sorteren."""
    # Indexes voor filteren op categorie en risico
    op.create_index("idx_etf_category", "etfs", ["category"])
    op.create_index("idx_etf_risk_level", "etfs", ["risk_level"])
    op.create_index("idx_etf_ter", "etfs", ["ter"])
    
    # Index voor volledig ISIN-lookup
    op.create_index("idx_etf_isin", "etfs", ["isin"], unique=True)
    
    # Index voor full-text search op naam (case-insensitive)
    op.create_index(
        "idx_etf_name",
        "etfs",
        [sa.func.lower(sa.column("name"))],
        postgresql_ops={"name": "varchar_pattern_ops"}
    )
    
    # Index voor sorting
    op.create_index("idx_etf_is_accumulating", "etfs", ["is_accumulating"])


def downgrade() -> None:
    """Verwijder de ETF-indexes."""
    op.drop_index("idx_etf_is_accumulating", table_name="etfs")
    op.drop_index("idx_etf_name", table_name="etfs")
    op.drop_index("idx_etf_isin", table_name="etfs")
    op.drop_index("idx_etf_ter", table_name="etfs")
    op.drop_index("idx_etf_risk_level", table_name="etfs")
    op.drop_index("idx_etf_category", table_name="etfs")
