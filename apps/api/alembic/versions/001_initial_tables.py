"""001 — initiële tabellen aanmaken.

Revision ID: 001
Revises:
Create Date: 2026-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Maak alle initiële tabellen aan."""
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("naam", sa.String(255), nullable=False),
        sa.Column("taal", sa.String(5), nullable=False, server_default="nl"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    op.create_table(
        "investor_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("goal_type", sa.String(50), nullable=False),
        sa.Column("goal_description", sa.Text, nullable=True),
        sa.Column("horizon_years", sa.Integer, nullable=False),
        sa.Column("monthly_budget", sa.Numeric(10, 2), nullable=False),
        sa.Column("emergency_fund_ready", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("risk_tolerance", sa.String(20), nullable=False),
        sa.Column("experience_level", sa.String(20), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    op.create_table(
        "plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("monthly_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("allocation", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("rationale", sa.Text, nullable=False),
        sa.Column("risk_notes", sa.Text, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    op.create_table(
        "checkins",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("month", sa.String(7), nullable=False),
        sa.Column("invested", sa.Boolean, nullable=False),
        sa.Column("emotional_state", sa.String(20), nullable=False),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("coach_response", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("user_id", "month", name="uq_checkin_user_month"),
    )

    op.create_table(
        "portfolio_positions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("etf_isin", sa.String(20), nullable=False),
        sa.Column("etf_ticker", sa.String(10), nullable=False),
        sa.Column("shares", sa.Numeric(10, 6), nullable=False),
        sa.Column("buy_price_eur", sa.Numeric(10, 4), nullable=False),
        sa.Column("buy_date", sa.Date, nullable=False),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    """Verwijder alle initiële tabellen in omgekeerde volgorde."""
    op.drop_table("portfolio_positions")
    op.drop_table("checkins")
    op.drop_table("plans")
    op.drop_table("investor_profiles")
    op.drop_table("users")
