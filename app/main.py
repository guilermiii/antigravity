from contextlib import asynccontextmanager
from typing import List, Optional

import alembic.command
import alembic.config
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.router import router as auth_router
from app.database import Base, engine, get_db
from app.models import User
from app.schemas import UserCreate, UserResponse, UserUpdate


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ciclo de vida da aplicação: executa as migrations do Alembic no PostgreSQL."""
    try:
        alembic_cfg = alembic.config.Config("alembic.ini")
        alembic.command.upgrade(alembic_cfg, "head")
    except Exception as e:
        print(f"[Lifespan] Aviso ao rodar migrações Alembic: {e}")
        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="API de Cadastro de Usuários & Autenticação OAuth2 [DEVELOPMENT]",
    description=(
        "Sistema completo de CRUD de usuários e autenticação federada OAuth 2.0 (GitHub e Google) com JWT, "
        "validações no Backend (Pydantic v2), validações nativas no banco de dados (PostgreSQL CHECK Constraints), "
        "migrações versionadas com Alembic e proteção integral contra SQL Injection e Script Injection (XSS). "
        "[AMBIENTE DE DESENVOLVIMENTO & HOMOLOGAÇÃO]"
    ),
    version="2.2.0-dev",
    lifespan=lifespan,
)

# Configuração de CORS para permitir requisições do frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusão do roteador de autenticação OAuth2 & JWT
app.include_router(auth_router)



@app.get(
    "/",
    tags=["Health & Status"],
    summary="Verificação de integridade da API",
    description="Retorna status de saúde da aplicação e link de acesso à documentação interativa Swagger.",
)
def read_root():
    return {
        "message": "Bem-vindo à API de Cadastro de Usuários! [DEVELOPMENT ENVIRONMENT]",
        "environment": "development",
        "debug": True,
        "version": "2.2.0-dev",
        "docs": "/docs",
    }



@app.post(
    "/users/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Users"],
    summary="Cadastrar novo usuário",
    description=(
        "Cria um novo usuário na base de dados. "
        "Campos obrigatórios: `nome`, `sobrenome` e `email`. "
        "Campos opcionais: `telefone`, `idade` (0 a 150), `genero`, `cpf` (11 dígitos válidos), "
        "`rua`, `numero`, `cidade`, `estado`, `cep`, `pais` e `escolaridade`. "
        "Garante unicidade do e-mail e validações de integridade no PostgreSQL."
    ),
    responses={
        201: {"description": "Usuário criado com sucesso."},
        400: {"description": "E-mail já cadastrado ou violação de integridade."},
        422: {"description": "Erro de validação nos campos informados."},
    },
)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # 1. Validação de unicidade do e-mail
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um usuário cadastrado com este e-mail.",
        )

    # 2. Criação via SQLAlchemy ORM (100% parametrizado, sem SQL injection)
    user_dict = user.model_dump()
    new_user = User(**user_dict)

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except IntegrityError as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de restrição no banco de dados: {str(err.orig)}",
        )

    return new_user


@app.get(
    "/users/",
    response_model=List[UserResponse],
    tags=["Users"],
    summary="Listar usuários",
    description="Retorna lista paginada de usuários cadastrados.",
)
def list_users(
    skip: int = Query(0, ge=0, description="Número de registros a pular"),
    limit: int = Query(100, ge=1, le=500, description="Número máximo de registros"),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.id.desc()).offset(skip).limit(limit).all()
    return users


@app.get(
    "/users/{user_id}",
    response_model=UserResponse,
    tags=["Users"],
    summary="Buscar usuário por ID",
    description="Retorna os dados completos do usuário indicado pelo identificador numérico.",
    responses={
        200: {"description": "Usuário localizado com sucesso."},
        404: {"description": "Usuário não encontrado."},
    },
)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )
    return user


@app.put(
    "/users/{user_id}",
    response_model=UserResponse,
    tags=["Users"],
    summary="Atualizar dados de um usuário",
    description="Permite atualização parcial ou total dos campos do usuário.",
    responses={
        200: {"description": "Usuário atualizado com sucesso."},
        400: {"description": "E-mail informado já pertence a outro usuário ou erro de integridade."},
        404: {"description": "Usuário não encontrado."},
        422: {"description": "Dados informados inválidos."},
    },
)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    # Se estiver alterando o e-mail, verificar se outro usuário já o utiliza
    if user_data.email and user_data.email != user.email:
        email_in_use = (
            db.query(User)
            .filter(User.email == user_data.email, User.id != user_id)
            .first()
        )
        if email_in_use:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe outro usuário cadastrado com este e-mail.",
            )

    # Aplica alterações parciais informadas
    update_dict = user_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(user, field, value)

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de restrição no banco de dados: {str(err.orig)}",
        )

    return user


@app.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Users"],
    summary="Excluir usuário",
    description="Remove permanentemente o usuário da base de dados.",
    responses={
        204: {"description": "Usuário excluído com sucesso."},
        404: {"description": "Usuário não encontrado."},
    },
)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    db.delete(user)
    db.commit()
    return None
