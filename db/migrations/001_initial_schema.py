"""Initial database schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-04-19
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

revision = "001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ─── users ────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("naam", sa.String(255), nullable=False),
        sa.Column("taal", sa.String(5), nullable=False, server_default="nl"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ─── investor_profiles ────────────────────────────────────────────────
    op.create_table(
        "investor_profiles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("goal_type", sa.String(50), nullable=False),
        sa.Column("goal_description", sa.Text, nullable=True),
        sa.Column("horizon_years", sa.Integer, nullable=False),
        sa.Column("monthly_budget", sa.Numeric(10, 2), nullable=False),
        sa.Column("emergency_fund_ready", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("risk_tolerance", sa.String(20), nullable=False),
        sa.Column("experience_level", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # ─── etfs ─────────────────────────────────────────────────────────────
    op.create_table(
        "etfs",
        sa.Column("isin", sa.String(12), primary_key=True),
        sa.Column("ticker", sa.String(20), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("issuer", sa.String(100), nullable=False),
        sa.Column("expense_ratio", sa.Numeric(6, 4), nullable=False),
        sa.Column("domicile", sa.String(5), nullable=False),
        sa.Column("asset_class", sa.String(30), nullable=False),
        sa.Column("region_focus", sa.String(100), nullable=False),
        sa.Column("distribution_type", sa.String(20), nullable=False),
        sa.Column("replication_method", sa.String(20), nullable=False),
        sa.Column("fund_size_million_eur", sa.Numeric(12, 2), nullable=True),
        sa.Column("currency", sa.String(5), nullable=False),
        sa.Column("index_tracked", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ─── etf_metrics ──────────────────────────────────────────────────────
    op.create_table(
        "etf_metrics",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("etf_isin", sa.String(12), sa.ForeignKey("etfs.isin", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("return_1y", sa.Numeric(8, 4), nullable=True),
        sa.Column("return_3y", sa.Numeric(8, 4), nullable=True),
        sa.Column("return_5y", sa.Numeric(8, 4), nullable=True),
        sa.Column("volatility_3y", sa.Numeric(8, 4), nullable=True),
        sa.Column("max_drawdown", sa.Numeric(8, 4), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ─── plans ────────────────────────────────────────────────────────────
    op.create_table(
        "plans",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("monthly_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("allocation", JSONB, nullable=False),   # [{ etf_isin, percentage, rationale }]
        sa.Column("rationale", sa.Text, nullable=False),
        sa.Column("risk_notes", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ─── checkins ─────────────────────────────────────────────────────────
    op.create_table(
        "checkins",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("month", sa.String(7), nullable=False),   # "2026-04"
        sa.Column("invested", sa.Boolean, nullable=False),
        sa.Column("emotional_state", sa.String(20), nullable=False),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("coach_response", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "month", name="uq_checkin_user_month"),
    )

    # ─── indexes ──────────────────────────────────────────────────────────
    op.create_index("ix_etfs_asset_class", "etfs", ["asset_class"])
    op.create_index("ix_etfs_region_focus", "etfs", ["region_focus"])
    op.create_index("ix_plans_user_id", "plans", ["user_id"])
    op.create_index("ix_checkins_user_id", "checkins", ["user_id"])


def downgrade() -> None:
    op.drop_table("checkins")
    op.drop_table("plans")
    op.drop_table("etf_metrics")
    op.drop_table("etfs")
    op.drop_table("investor_profiles")
    op.drop_table("users")
