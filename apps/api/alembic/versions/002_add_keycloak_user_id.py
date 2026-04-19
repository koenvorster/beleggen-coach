"""Add keycloak_user_id to users table.

Revision ID: 002
Revises: 001
Create Date: 2026-04-19
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("keycloak_user_id", sa.String(255), nullable=True),
    )
    op.create_unique_constraint("uq_users_keycloak_user_id", "users", ["keycloak_user_id"])
    op.create_index("ix_users_keycloak_user_id", "users", ["keycloak_user_id"])


def downgrade() -> None:
    op.drop_index("ix_users_keycloak_user_id", table_name="users")
    op.drop_constraint("uq_users_keycloak_user_id", "users", type_="unique")
    op.drop_column("users", "keycloak_user_id")
