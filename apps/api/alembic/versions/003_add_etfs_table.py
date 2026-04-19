"""003 — etfs tabel aanmaken.

Revision ID: 003
Revises: 002
Create Date: 2026-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Maak de etfs tabel aan."""
    op.create_table(
        "etfs",
        sa.Column("isin", sa.String(12), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("ter", sa.Numeric(6, 4), nullable=False),
        sa.Column("risk_level", sa.Integer, nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="EUR"),
        sa.Column("benchmark", sa.String(255), nullable=True),
        sa.Column("fund_size_m", sa.Numeric(14, 2), nullable=True),
        sa.Column("ytd_return", sa.Numeric(8, 4), nullable=True),
        sa.Column("one_year_return", sa.Numeric(8, 4), nullable=True),
        sa.Column("three_year_return", sa.Numeric(8, 4), nullable=True),
        sa.Column("inception_date", sa.Date, nullable=True),
        sa.Column("is_accumulating", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("replication_method", sa.String(20), nullable=False, server_default="physical"),
        sa.Column("domicile", sa.String(2), nullable=False, server_default="IE"),
    )


def downgrade() -> None:
    """Verwijder de etfs tabel."""
    op.drop_table("etfs")
