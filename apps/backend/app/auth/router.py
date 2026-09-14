from typing import Any, Dict, Optional
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.auth.config import FRONTEND_URL
from app.auth.providers import github_provider, google_provider
from app.auth.security import (
    generate_oauth_state,
    get_current_user,
    verify_oauth_state,
)
from app.auth.service import auth_service
from app.database import get_db
from app.metrics import record_oauth_login
from app.models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get(
    "/{provider}/login",
    summary="Iniciar autenticação OAuth2",
    description="Gera o state criptográfico anti-CSRF e redireciona para a página de autorização do provedor (GitHub ou Google).",
    response_class=RedirectResponse,
    status_code=status.HTTP_302_FOUND,
)
def oauth_login(provider: str):
    provider = provider.lower()
    if provider == "github":
        client = github_provider
    elif provider == "google":
        client = google_provider
    else:
        record_oauth_login(provider, "unsupported_provider")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provedor '{provider}' não é suportado.",
        )

    record_oauth_login(provider, "login_started")
    state = generate_oauth_state(provider)
    authorization_url = client.get_authorization_url(state)
    return RedirectResponse(url=authorization_url, status_code=status.HTTP_302_FOUND)


@router.get(
    "/{provider}/callback",
    summary="Callback do provedor OAuth2",
    description="Recebe o código de autorização e o state, valida integridade e CSRF, provisiona/vincula o usuário e redireciona ao frontend com o token de sessão.",
)
async def oauth_callback(
    provider: str,
    code: Optional[str] = Query(None, description="Código de autorização do provedor"),
    state: Optional[str] = Query(None, description="State criptográfico anti-CSRF"),
    error: Optional[str] = Query(None, description="Erro retornado pelo provedor OAuth"),
    error_description: Optional[str] = Query(None, description="Descrição do erro retornado pelo provedor"),
    db: Session = Depends(get_db),
):
    provider = provider.lower()
    if provider not in ["github", "google"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provedor '{provider}' não é suportado.",
        )

    # Tratamento de erro reportado pelo provedor OAuth (ex: usuário cancelou na tela de consentimento)
    if error:
        record_oauth_login(provider, "provider_error")
        err_msg = error_description or error or "Autenticação cancelada ou recusada pelo provedor."
        return RedirectResponse(
            url=f"{FRONTEND_URL}/#auth_error={quote(err_msg)}",
            status_code=status.HTTP_302_FOUND,
        )

    # 1. Validação estrita de State (Proteção Anti-CSRF e Anti-Adulteração)
    if not state or not verify_oauth_state(state, expected_provider=provider):
        record_oauth_login(provider, "csrf_rejected")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="State inválido, expirado ou adulterado. Falha de validação de segurança.",
        )

    # 2. Validação de presença do código de autorização
    if not code:
        record_oauth_login(provider, "missing_code")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código de autorização não fornecido pelo provedor.",
        )

    # 3. Processamento do Callback via AuthService
    try:
        user, token = await auth_service.process_oauth_callback(
            db=db,
            provider=provider,
            code=code,
        )
        record_oauth_login(provider, "success")
    except ValueError as err:
        record_oauth_login(provider, "callback_failed")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )

    # 4. Redirecionamento seguro para o Frontend com o token no fragmento de hash (#token=)
    # O hash fragment (#) não é transmitido ao servidor em requisições HTTP subsequentes,
    # prevenindo vazamento de tokens em access logs intermediários.
    redirect_target = f"{FRONTEND_URL}/#token={token}"
    return RedirectResponse(url=redirect_target, status_code=status.HTTP_302_FOUND)


@router.get(
    "/me",
    summary="Obter perfil do usuário autenticado",
    description="Retorna as informações do usuário autenticado a partir do token JWT Bearer e suas contas federadas vinculadas.",
)
def get_me(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    linked_providers = [acc.provider for acc in current_user.oauth_accounts]
    return {
        "id": current_user.id,
        "nome": current_user.nome,
        "sobrenome": current_user.sobrenome,
        "email": current_user.email,
        "avatar_url": current_user.avatar_url,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "linked_providers": linked_providers,
    }


@router.post(
    "/logout",
    summary="Encerrar sessão",
    description="Endpoint informativo para encerramento de sessão pelo cliente.",
)
def logout():
    return {"message": "Sessão encerrada com sucesso."}
