import hashlib
import hmac
import html
import re
import time
import secrets
from typing import Optional
from urllib.parse import urlparse

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.auth.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    FRONTEND_URL,
    JWT_ALGORITHM,
    JWT_SECRET_KEY,
)
from app.database import get_db
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def generate_oauth_state(provider: str) -> str:
    """Gera um token de state criptograficamente seguro com HMAC-SHA256 e timestamp anti-CSRF."""
    timestamp = str(int(time.time()))
    nonce = secrets.token_hex(8)
    data = f"{provider}:{timestamp}:{nonce}"
    signature = hmac.new(
        JWT_SECRET_KEY.encode(),
        data.encode(),
        hashlib.sha256,
    ).hexdigest()
    return f"{data}.{signature}"


def verify_oauth_state(
    state: Optional[str],
    expected_provider: str,
    max_age_seconds: int = 600,
) -> bool:
    """Valida a assinatura HMAC, expiração (10 minutos) e provedor correspondente do state."""
    if not state or not isinstance(state, str):
        return False

    try:
        if "." not in state:
            return False
        data, signature = state.rsplit(".", 1)
        parts = data.split(":")
        if len(parts) != 3:
            return False

        provider, timestamp_str, _ = parts
        if provider != expected_provider:
            return False

        # Verifica expiração (anti-replay / TTL de 10 min)
        timestamp = int(timestamp_str)
        current_time = int(time.time())
        if current_time - timestamp > max_age_seconds or current_time < timestamp - 60:
            return False

        # Validação de assinatura em tempo constante (anti-timing attack)
        expected_sig = hmac.new(
            JWT_SECRET_KEY.encode(),
            data.encode(),
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(signature, expected_sig)
    except Exception:
        return False


def create_access_token(
    data: dict,
    expires_delta_seconds: Optional[int] = None,
) -> str:
    """Gera um JWT assinado com claims e tempo de expiração estrito."""
    to_encode = data.copy()
    if expires_delta_seconds is not None:
        expire = int(time.time()) + expires_delta_seconds
    else:
        expire = int(time.time()) + (ACCESS_TOKEN_EXPIRE_MINUTES * 60)

    to_encode.update({"exp": expire, "iat": int(time.time())})
    encoded_jwt = jwt.encode(
        to_encode,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decodifica e valida o JWT, forçando algoritmo restrito para prevenir ataque 'alg: none'."""
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],  # Bloqueia qualquer outro algoritmo, incluindo "none"
        )
        return payload
    except (jwt.PyJWTError, Exception):
        return None


def sanitize_text(text: Optional[str]) -> str:
    """Remove tags HTML/Script e sanitiza caracteres perigosos contra XSS."""
    if not text:
        return ""
    # Remove tags HTML
    clean = re.sub(r"<[^>]*?>", "", str(text))
    # Escapa entidades
    clean = html.escape(clean)
    # Remove quebras de linha e caracteres de controle perigosos
    clean = re.sub(r"[\r\n\t]", " ", clean).strip()
    return clean


def sanitize_avatar_url(url: Optional[str]) -> Optional[str]:
    """Valida que a URL de avatar pertença exclusivamente a esquemas seguros (http/https)."""
    if not url or not isinstance(url, str):
        return None
    url = url.strip()
    # Bloqueia expressamente esquemas de execução script
    lower = url.lower()
    if lower.startswith("javascript:") or lower.startswith("data:") or lower.startswith("vbscript:"):
        return None

    parsed = urlparse(url)
    if parsed.scheme in ["http", "https"] and parsed.netloc:
        return url
    return None


def validate_redirect_url(url: Optional[str]) -> bool:
    """Valida se a URL de redirecionamento pertence à origem permitida (Anti Open Redirect)."""
    if not url or not isinstance(url, str):
        return False
    # Bloqueia esquemas como javascript: e URLs relativas com //
    if url.startswith("//") or url.lower().startswith("javascript:"):
        return False

    parsed = urlparse(url)
    allowed_parsed = urlparse(FRONTEND_URL)

    # Permite caminhos relativos puros
    if not parsed.netloc:
        return url.startswith("/")

    # Ou mesma origem do frontend configurado
    return parsed.scheme == allowed_parsed.scheme and parsed.netloc == allowed_parsed.netloc


def parse_oauth_name(
    name: Optional[str],
    username: Optional[str] = None,
) -> tuple[str, str]:
    """
    Interpreta o nome do perfil retornado pelo provedor e garante conformidade com
    as restrições do banco PostgreSQL (length(trim(nome)) >= 2 e length(trim(sobrenome)) >= 2).
    """
    clean_name = sanitize_text(name)
    clean_username = sanitize_text(username)

    if clean_name:
        parts = clean_name.split()
        if len(parts) >= 2:
            nome = parts[0]
            sobrenome = " ".join(parts[1:])
            return (
                nome if len(nome) >= 2 else f"{nome}_",
                sobrenome if len(sobrenome) >= 2 else f"{sobrenome}_",
            )
        elif len(parts) == 1:
            nome = parts[0]
            sobrenome = clean_username if clean_username and len(clean_username) >= 2 else "Conta"
            return (nome if len(nome) >= 2 else "User", sobrenome)

    # Fallback quando não há nome cadastrado no perfil
    fallback_nome = clean_username if clean_username and len(clean_username) >= 2 else "Usuario"
    return (fallback_nome, "OAuth")


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Dependência injetável para autenticação de rotas protegidas."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticação necessária. Token não fornecido.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sem identificador de usuário.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token com formato de ID inválido.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário desativado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
