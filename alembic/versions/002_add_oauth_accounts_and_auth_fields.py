"""002_add_oauth_accounts_and_auth_fields

Revision ID: 002_add_oauth_accounts
Revises: 001_expand_users
Create Date: 2026-09-09 20:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "002_add_oauth_accounts"
down_revision: Union[str, None] = "001_expand_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # 1. Adiciona colunas de autenticação e perfil na tabela users se não existirem
    if "users" in tables:
        columns = [c["name"] for c in inspector.get_columns("users")]

        if "avatar_url" not in columns:
            op.add_column("users", sa.Column("avatar_url", sa.String(500), nullable=True))

        if "is_active" not in columns:
            op.add_column(
                "users",
                sa.Column(
                    "is_active",
                    sa.Boolean(),
                    nullable=False,
                    server_default=sa.text("true"),
                ),
            )

        if "role" not in columns:
            op.add_column(
                "users",
                sa.Column(
                    "role",
                    sa.String(20),
                    nullable=False,
                    server_default=sa.text("'user'"),
                ),
            )

    # 2. Cria tabela oauth_accounts para suporte a múltiplos provedores (GitHub, Google)
    if "oauth_accounts" not in tables:
        op.create_table(
            "oauth_accounts",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column(
                "user_id",
                sa.Integer(),
                sa.ForeignKey("users.id", ondelete="CASCADE"),
                nullable=False,
                index=True,
            ),
            sa.Column("provider", sa.String(50), nullable=False),
            sa.Column("provider_user_id", sa.String(100), nullable=False),
            sa.Column("provider_email", sa.String(150), nullable=True),
            sa.Column("avatar_url", sa.String(500), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
            ),
            sa.UniqueConstraint(
                "provider", "provider_user_id", name="uq_provider_user_id"
            ),
            sa.CheckConstraint(
                "provider IN ('github', 'google')", name="check_provider_valido"
            ),
        )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "oauth_accounts" in tables:
        op.drop_table("oauth_accounts")

    if "users" in tables:
        columns = [c["name"] for c in inspector.get_columns("users")]
        if "role" in columns:
            op.drop_column("users", "role")
        if "is_active" in columns:
            op.drop_column("users", "is_active")
        if "avatar_url" in columns:
            op.drop_column("users", "avatar_url")
