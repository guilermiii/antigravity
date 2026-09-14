from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator

from app.validators import validate_cpf, validate_cep, validate_phone


class UserBase(BaseModel):
    nome: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Primeiro nome do usuário (obrigatório)",
        examples=["Guilherme"],
    )
    sobrenome: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Sobrenome do usuário (obrigatório)",
        examples=["Morais"],
    )
    email: EmailStr = Field(
        ...,
        max_length=150,
        description="Endereço de e-mail único (obrigatório)",
        examples=["guilherme@example.com"],
    )
    telefone: Optional[str] = Field(
        None,
        max_length=20,
        description="Telefone de contato no formato (XX) XXXXX-XXXX",
        examples=["(11) 98765-4321"],
    )
    idade: Optional[int] = Field(
        None,
        ge=0,
        le=150,
        description="Idade em anos completos (0 a 150)",
        examples=[28],
    )
    genero: Optional[str] = Field(
        None,
        max_length=50,
        description="Identidade de gênero",
        examples=["Masculino"],
    )
    cpf: Optional[str] = Field(
        None,
        max_length=14,
        description="CPF válido do usuário (11 dígitos)",
        examples=["52998224725"],
    )
    rua: Optional[str] = Field(
        None,
        max_length=200,
        description="Logradouro ou rua de residência",
        examples=["Avenida Paulista"],
    )
    numero: Optional[str] = Field(
        None,
        max_length=20,
        description="Número do endereço",
        examples=["1000"],
    )
    cidade: Optional[str] = Field(
        None,
        max_length=100,
        description="Cidade",
        examples=["São Paulo"],
    )
    estado: Optional[str] = Field(
        None,
        max_length=50,
        description="Estado ou Unidade Federativa",
        examples=["SP"],
    )
    cep: Optional[str] = Field(
        None,
        max_length=20,
        description="CEP no padrão 00000-000",
        examples=["01310-100"],
    )
    pais: Optional[str] = Field(
        "Brasil",
        max_length=100,
        description="País de residência",
        examples=["Brasil"],
    )
    escolaridade: Optional[str] = Field(
        None,
        max_length=100,
        description="Grau de escolaridade / formação",
        examples=["Ensino Superior"],
    )

    @field_validator("nome", "sobrenome")
    @classmethod
    def validate_names(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("O campo não pode ser vazio ou conter apenas espaços.")
        stripped = v.strip()
        if len(stripped) < 2:
            raise ValueError("O campo deve conter no mínimo 2 caracteres.")
        return stripped

    @field_validator("cpf")
    @classmethod
    def check_cpf(cls, v: Optional[str]) -> Optional[str]:
        return validate_cpf(v)

    @field_validator("cep")
    @classmethod
    def check_cep(cls, v: Optional[str]) -> Optional[str]:
        return validate_cep(v)

    @field_validator("telefone")
    @classmethod
    def check_phone(cls, v: Optional[str]) -> Optional[str]:
        return validate_phone(v)


class UserCreate(UserBase):
    """Schema para criação de novos usuários."""
    pass


class UserUpdate(BaseModel):
    """Schema para atualização atômica ou parcial de usuário."""
    nome: Optional[str] = Field(None, min_length=2, max_length=100)
    sobrenome: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = Field(None, max_length=150)
    telefone: Optional[str] = Field(None, max_length=20)
    idade: Optional[int] = Field(None, ge=0, le=150)
    genero: Optional[str] = Field(None, max_length=50)
    cpf: Optional[str] = Field(None, max_length=14)
    rua: Optional[str] = Field(None, max_length=200)
    numero: Optional[str] = Field(None, max_length=20)
    cidade: Optional[str] = Field(None, max_length=100)
    estado: Optional[str] = Field(None, max_length=50)
    cep: Optional[str] = Field(None, max_length=20)
    pais: Optional[str] = Field(None, max_length=100)
    escolaridade: Optional[str] = Field(None, max_length=100)

    @field_validator("nome", "sobrenome")
    @classmethod
    def validate_names(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        stripped = v.strip()
        if len(stripped) < 2:
            raise ValueError("O campo deve conter no mínimo 2 caracteres.")
        return stripped

    @field_validator("cpf")
    @classmethod
    def check_cpf(cls, v: Optional[str]) -> Optional[str]:
        return validate_cpf(v)

    @field_validator("cep")
    @classmethod
    def check_cep(cls, v: Optional[str]) -> Optional[str]:
        return validate_cep(v)

    @field_validator("telefone")
    @classmethod
    def check_phone(cls, v: Optional[str]) -> Optional[str]:
        return validate_phone(v)


class UserResponse(UserBase):
    """Schema de resposta com dados persistidos do usuário."""
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
