from typing import Tuple
from sqlalchemy.orm import Session

from app.auth.providers import github_provider, google_provider
from app.auth.security import (
    create_access_token,
    parse_oauth_name,
    sanitize_avatar_url,
)
from app.metrics import APP_USERS_TOTAL, record_user_operation
from app.models import OAuthAccount, User


class AuthService:
    """Regras de negócio para autenticação OAuth, provisionamento seguro e vinculação de contas."""

    async def process_oauth_callback(
        self,
        db: Session,
        provider: str,
        code: str,
    ) -> Tuple[User, str]:
        if provider == "github":
            client = github_provider
        elif provider == "google":
            client = google_provider
        else:
            raise ValueError(f"Provedor '{provider}' não suportado.")

        # 1. Troca o code pelo access_token do provedor
        access_token = await client.exchange_code(code)

        # 2. Busca dados de perfil do usuário no provedor
        profile = await client.get_user_profile(access_token)

        provider_user_id = str(profile["id"])
        email = profile["email"].lower().strip()
        raw_name = profile.get("name")
        username = profile.get("username")
        avatar_url = sanitize_avatar_url(profile.get("avatar_url"))

        # 3. Verifica se a conta externa já existe vinculada
        oauth_account = (
            db.query(OAuthAccount)
            .filter(
                OAuthAccount.provider == provider,
                OAuthAccount.provider_user_id == provider_user_id,
            )
            .first()
        )

        if oauth_account:
            user = oauth_account.user
            # Atualiza avatar se houver alteração
            if avatar_url:
                oauth_account.avatar_url = avatar_url
                if not user.avatar_url:
                    user.avatar_url = avatar_url
            db.commit()
            db.refresh(user)
        else:
            # 4. Estratégia de Account Linking: busca usuário existente pelo mesmo e-mail verificado
            user = db.query(User).filter(User.email == email).first()

            if not user:
                # Cria novo usuário com dados sanitizados respeitando constraints do banco
                nome, sobrenome = parse_oauth_name(raw_name, username=username)
                user = User(
                    nome=nome,
                    sobrenome=sobrenome,
                    email=email,
                    avatar_url=avatar_url,
                    role="user",
                    is_active=True,
                )
                db.add(user)
                db.flush()  # Obtém o ID gerado
                APP_USERS_TOTAL.inc()
                record_user_operation("create", "oauth_success")

            # 5. Vincula a nova conta OAuth ao usuário
            new_oauth = OAuthAccount(
                user_id=user.id,
                provider=provider,
                provider_user_id=provider_user_id,
                provider_email=email,
                avatar_url=avatar_url,
            )
            db.add(new_oauth)

            if avatar_url and not user.avatar_url:
                user.avatar_url = avatar_url

            db.commit()
            db.refresh(user)

        # 6. Emite o JWT de sessão da aplicação
        token = create_access_token(
            {
                "sub": str(user.id),
                "email": user.email,
                "role": user.role,
            }
        )

        return user, token


auth_service = AuthService()
