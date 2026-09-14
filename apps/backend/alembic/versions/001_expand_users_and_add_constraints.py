"""001_expand_users_and_add_constraints

Revision ID: 001_expand_users
Revises: 
Create Date: 2026-09-09 20:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "001_expand_users"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "users" not in tables:
        # Cria a tabela completa do zero com constraints nativas
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("nome", sa.String(100), nullable=False),
            sa.Column("sobrenome", sa.String(100), nullable=False),
            sa.Column("email", sa.String(150), nullable=False, unique=True, index=True),
            sa.Column("telefone", sa.String(20), nullable=True),
            sa.Column("idade", sa.Integer(), nullable=True),
            sa.Column("genero", sa.String(50), nullable=True),
            sa.Column("cpf", sa.String(14), nullable=True, index=True),
            sa.Column("rua", sa.String(200), nullable=True),
            sa.Column("numero", sa.String(20), nullable=True),
            sa.Column("cidade", sa.String(100), nullable=True),
            sa.Column("estado", sa.String(50), nullable=True),
            sa.Column("cep", sa.String(20), nullable=True),
            sa.Column("pais", sa.String(100), nullable=True, server_default="Brasil"),
            sa.Column("escolaridade", sa.String(100), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.CheckConstraint("length(trim(nome)) >= 2", name="check_nome_valido"),
            sa.CheckConstraint("length(trim(sobrenome)) >= 2", name="check_sobrenome_valido"),
            sa.CheckConstraint("email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'", name="check_email_formato"),
            sa.CheckConstraint("idade IS NULL OR (idade >= 0 AND idade <= 150)", name="check_idade_valida"),
            sa.CheckConstraint("cpf IS NULL OR (cpf ~ '^[0-9]{11}$')", name="check_cpf_valido"),
            sa.CheckConstraint("cep IS NULL OR (cep ~ '^[0-9]{5}-[0-9]{3}$')", name="check_cep_valido"),
            sa.CheckConstraint("telefone IS NULL OR (length(telefone) >= 10 AND length(telefone) <= 20)", name="check_telefone_valido"),
        )
    else:
        # Tabela já existe: adiciona colunas que faltam e migra dados
        columns = [c["name"] for c in inspector.get_columns("users")]

        new_columns = [
            ("nome", sa.String(100), True),
            ("sobrenome", sa.String(100), True),
            ("telefone", sa.String(20), True),
            ("idade", sa.Integer(), True),
            ("genero", sa.String(50), True),
            ("cpf", sa.String(14), True),
            ("rua", sa.String(200), True),
            ("numero", sa.String(20), True),
            ("cidade", sa.String(100), True),
            ("estado", sa.String(50), True),
            ("cep", sa.String(20), True),
            ("pais", sa.String(100), True),
            ("escolaridade", sa.String(100), True),
        ]

        for col_name, col_type, nullable in new_columns:
            if col_name not in columns:
                op.add_column("users", sa.Column(col_name, col_type, nullable=nullable))

        # Se existir a coluna legada 'name', migra os dados
        if "name" in columns:
            op.execute(
                """
                UPDATE users
                SET 
                    nome = split_part(name, ' ', 1),
                    sobrenome = COALESCE(NULLIF(substr(name, length(split_part(name, ' ', 1)) + 2), ''), '-')
                WHERE nome IS NULL OR nome = '';
                """
            )
            op.drop_column("users", "name")

        # Garante NOT NULL em nome e sobrenome
        op.alter_column("users", "nome", nullable=False)
        op.alter_column("users", "sobrenome", nullable=False)

        # Adiciona índices e constraints
        indexes = [ix["name"] for ix in inspector.get_indexes("users")]
        if "ix_users_cpf" not in indexes:
            op.create_index("ix_users_cpf", "users", ["cpf"], unique=False)

        # Cria Check Constraints caso não existam
        constraints = [c["name"] for c in inspector.get_check_constraints("users")]
        check_list = [
            ("check_nome_valido", "length(trim(nome)) >= 2"),
            ("check_sobrenome_valido", "length(trim(sobrenome)) >= 2"),
            ("check_email_formato", "email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'"),
            ("check_idade_valida", "idade IS NULL OR (idade >= 0 AND idade <= 150)"),
            ("check_cpf_valido", "cpf IS NULL OR (cpf ~ '^[0-9]{11}$')"),
            ("check_cep_valido", "cep IS NULL OR (cep ~ '^[0-9]{5}-[0-9]{3}$')"),
            ("check_telefone_valido", "telefone IS NULL OR (length(telefone) >= 10 AND length(telefone) <= 20)"),
        ]

        for c_name, c_expr in check_list:
            if c_name not in constraints:
                op.create_check_constraint(c_name, "users", c_expr)


def downgrade() -> None:
    pass
