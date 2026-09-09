from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("length(trim(nome)) >= 2", name="check_nome_valido"),
        CheckConstraint("length(trim(sobrenome)) >= 2", name="check_sobrenome_valido"),
        CheckConstraint(
            "email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'",
            name="check_email_formato",
        ),
        CheckConstraint(
            "idade IS NULL OR (idade >= 0 AND idade <= 150)",
            name="check_idade_valida",
        ),
        CheckConstraint(
            "cpf IS NULL OR (cpf ~ '^[0-9]{11}$')",
            name="check_cpf_valido",
        ),
        CheckConstraint(
            "cep IS NULL OR (cep ~ '^[0-9]{5}-[0-9]{3}$')",
            name="check_cep_valido",
        ),
        CheckConstraint(
            "telefone IS NULL OR (length(telefone) >= 10 AND length(telefone) <= 20)",
            name="check_telefone_valido",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    sobrenome = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    telefone = Column(String(20), nullable=True)
    idade = Column(Integer, nullable=True)
    genero = Column(String(50), nullable=True)
    cpf = Column(String(14), index=True, nullable=True)
    rua = Column(String(200), nullable=True)
    numero = Column(String(20), nullable=True)
    cidade = Column(String(100), nullable=True)
    estado = Column(String(50), nullable=True)
    cep = Column(String(20), nullable=True)
    pais = Column(String(100), nullable=True, default="Brasil")
    escolaridade = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    role = Column(String(20), default="user", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    oauth_accounts = relationship(
        "OAuthAccount",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class OAuthAccount(Base):
    """Mapeamento de contas de autenticação externa OAuth 2.0 (GitHub, Google)."""

    __tablename__ = "oauth_accounts"
    __table_args__ = (
        UniqueConstraint("provider", "provider_user_id", name="uq_provider_user_id"),
        CheckConstraint("provider IN ('github', 'google')", name="check_provider_valido"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    provider = Column(String(50), nullable=False)
    provider_user_id = Column(String(100), nullable=False)
    provider_email = Column(String(150), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="oauth_accounts")

