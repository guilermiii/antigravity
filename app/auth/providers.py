from typing import Any, Dict, Optional
import httpx

from app.auth.config import (
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_REDIRECT_URI,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
)


class GitHubOAuthProvider:
    """Cliente de integração OAuth 2.0 com GitHub."""

    AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
    TOKEN_URL = "https://github.com/login/oauth/access_token"
    USER_API_URL = "https://api.github.com/user"
    EMAILS_API_URL = "https://api.github.com/user/emails"

    def get_authorization_url(self, state: str) -> str:
        params = {
            "client_id": GITHUB_CLIENT_ID,
            "redirect_uri": GITHUB_REDIRECT_URI,
            "scope": "read:user user:email",
            "state": state,
        }
        query_string = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.AUTHORIZE_URL}?{query_string}"

    async def exchange_code(self, code: str) -> str:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                self.TOKEN_URL,
                headers={"Accept": "application/json"},
                data={
                    "client_id": GITHUB_CLIENT_ID,
                    "client_secret": GITHUB_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": GITHUB_REDIRECT_URI,
                },
            )
            if res.status_code != 200:
                raise ValueError(f"Falha ao trocar código com GitHub: {res.text}")
            data = res.json()
            if "error" in data:
                raise ValueError(f"Erro retornado pelo GitHub: {data.get('error_description', data['error'])}")
            token = data.get("access_token")
            if not token:
                raise ValueError("Nenhum access_token retornado pelo GitHub.")
            return token

    async def get_user_profile(self, access_token: str) -> Dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "Antigravity-OAuth-App",
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            user_res = await client.get(self.USER_API_URL, headers=headers)
            if user_res.status_code != 200:
                raise ValueError("Não foi possível obter os dados de perfil do GitHub.")
            user_data = user_res.json()

            email = user_data.get("email")
            # Se o e-mail não for público no perfil, busca na rota /user/emails
            if not email:
                emails_res = await client.get(self.EMAILS_API_URL, headers=headers)
                if emails_res.status_code == 200:
                    emails_list = emails_res.json()
                    for item in emails_list:
                        if item.get("primary") and item.get("verified"):
                            email = item.get("email")
                            break
                    if not email and emails_list:
                        email = emails_list[0].get("email")

            if not email:
                email = f"{user_data.get('login')}@users.noreply.github.com"

            return {
                "id": str(user_data["id"]),
                "email": email,
                "name": user_data.get("name"),
                "avatar_url": user_data.get("avatar_url"),
                "username": user_data.get("login"),
            }


class GoogleOAuthProvider:
    """Cliente de integração OAuth 2.0 com Google / Gmail."""

    AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"

    def get_authorization_url(self, state: str) -> str:
        params = {
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "prompt": "select_account",
        }
        query_string = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.AUTHORIZE_URL}?{query_string}"

    async def exchange_code(self, code: str) -> str:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                self.TOKEN_URL,
                data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": GOOGLE_REDIRECT_URI,
                },
            )
            if res.status_code != 200:
                raise ValueError(f"Falha ao trocar código com Google: {res.text}")
            data = res.json()
            token = data.get("access_token")
            if not token:
                raise ValueError("Nenhum access_token retornado pelo Google.")
            return token

    async def get_user_profile(self, access_token: str) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {access_token}"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(self.USERINFO_URL, headers=headers)
            if res.status_code != 200:
                raise ValueError("Não foi possível obter dados de perfil do Google.")
            user_data = res.json()

            email = user_data.get("email")
            if not email:
                raise ValueError("Conta Google não possui e-mail associado.")

            return {
                "id": str(user_data.get("sub")),
                "email": email,
                "name": user_data.get("name"),
                "avatar_url": user_data.get("picture"),
                "username": email.split("@")[0],
            }


github_provider = GitHubOAuthProvider()
google_provider = GoogleOAuthProvider()
