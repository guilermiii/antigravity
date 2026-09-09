import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.auth.security import create_access_token, generate_oauth_state
from app.database import Base, engine, get_db
from app.main import app
from app.models import OAuthAccount, User


class TestAuthIntegration(unittest.TestCase):
    """Testes de integração para os fluxos OAuth2 de GitHub e Google."""

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)

    def setUp(self):
        self.client = TestClient(app)

    def tearDown(self):
        db = next(get_db())
        try:
            # Limpa usuários de teste
            test_emails = [
                "integracao_gh@example.com",
                "integracao_google@example.com",
                "linking_user@example.com",
            ]
            users = db.query(User).filter(User.email.in_(test_emails)).all()
            for u in users:
                db.delete(u)
            db.commit()
        finally:
            db.close()

    def test_github_login_redirect(self):
        """GET /auth/github/login deve redirecionar com URL de autorização do GitHub."""
        response = self.client.get("/auth/github/login", follow_redirects=False)
        self.assertIn(response.status_code, [302, 307])
        location = response.headers.get("location", "")
        self.assertTrue(location.startswith("https://github.com/login/oauth/authorize"))
        self.assertIn("client_id=", location)
        self.assertIn("state=", location)
        self.assertIn("scope=", location)

    def test_google_login_redirect(self):
        """GET /auth/google/login deve redirecionar com URL de autorização do Google."""
        response = self.client.get("/auth/google/login", follow_redirects=False)
        self.assertIn(response.status_code, [302, 307])
        location = response.headers.get("location", "")
        self.assertTrue(
            location.startswith("https://accounts.google.com/o/oauth2/v2/auth")
        )
        self.assertIn("client_id=", location)
        self.assertIn("state=", location)
        self.assertIn("scope=", location)

    def test_github_callback_success_creates_user(self):
        """Callback bem-sucedido do GitHub deve criar usuário e conta OAuth."""
        state = generate_oauth_state("github")
        mock_profile = {
            "id": "111222333",
            "email": "integracao_gh@example.com",
            "name": "Octo Cat",
            "avatar_url": "https://avatars.githubusercontent.com/u/111222333",
            "username": "octocat",
        }

        with patch(
            "app.auth.providers.github_provider.exchange_code",
            new_callable=AsyncMock,
            return_value="gh_token_xyz",
        ), patch(
            "app.auth.providers.github_provider.get_user_profile",
            new_callable=AsyncMock,
            return_value=mock_profile,
        ):
            response = self.client.get(
                f"/auth/github/callback?code=gh_valid_code&state={state}",
                follow_redirects=False,
            )
            self.assertIn(response.status_code, [302, 307])
            location = response.headers.get("location", "")
            self.assertIn("#token=", location)

            # Valida que o usuário foi inserido no banco de dados
            db = next(get_db())
            try:
                user = (
                    db.query(User)
                    .filter(User.email == "integracao_gh@example.com")
                    .first()
                )
                self.assertIsNotNone(user)
                self.assertEqual(user.nome, "Octo")
                self.assertEqual(user.sobrenome, "Cat")

                oauth = (
                    db.query(OAuthAccount)
                    .filter(
                        OAuthAccount.user_id == user.id,
                        OAuthAccount.provider == "github",
                    )
                    .first()
                )
                self.assertIsNotNone(oauth)
                self.assertEqual(oauth.provider_user_id, "111222333")
            finally:
                db.close()

    def test_google_callback_success_creates_user(self):
        """Callback bem-sucedido do Google deve criar usuário e conta OAuth."""
        state = generate_oauth_state("google")
        mock_profile = {
            "id": "444555666",
            "email": "integracao_google@example.com",
            "name": "Google User",
            "avatar_url": "https://lh3.googleusercontent.com/a/photo",
            "username": "googleuser",
        }

        with patch(
            "app.auth.providers.google_provider.exchange_code",
            new_callable=AsyncMock,
            return_value="google_token_xyz",
        ), patch(
            "app.auth.providers.google_provider.get_user_profile",
            new_callable=AsyncMock,
            return_value=mock_profile,
        ):
            response = self.client.get(
                f"/auth/google/callback?code=google_valid_code&state={state}",
                follow_redirects=False,
            )
            self.assertIn(response.status_code, [302, 307])
            location = response.headers.get("location", "")
            self.assertIn("#token=", location)

            db = next(get_db())
            try:
                user = (
                    db.query(User)
                    .filter(User.email == "integracao_google@example.com")
                    .first()
                )
                self.assertIsNotNone(user)
                oauth = (
                    db.query(OAuthAccount)
                    .filter(
                        OAuthAccount.user_id == user.id,
                        OAuthAccount.provider == "google",
                    )
                    .first()
                )
                self.assertIsNotNone(oauth)
            finally:
                db.close()

    def test_account_linking_same_email(self):
        """Login com provedores diferentes sob o mesmo e-mail vincula à mesma conta de usuário."""
        # 1. Cria usuário inicial via GitHub
        state_gh = generate_oauth_state("github")
        profile_gh = {
            "id": "link_gh_123",
            "email": "linking_user@example.com",
            "name": "Alex Silva",
            "avatar_url": "https://avatars.githubusercontent.com/u/1",
            "username": "alexgh",
        }
        with patch(
            "app.auth.providers.github_provider.exchange_code",
            new_callable=AsyncMock,
            return_value="tok1",
        ), patch(
            "app.auth.providers.github_provider.get_user_profile",
            new_callable=AsyncMock,
            return_value=profile_gh,
        ):
            self.client.get(
                f"/auth/github/callback?code=code1&state={state_gh}",
                follow_redirects=False,
            )

        # 2. Faz login com Google com o MESMO e-mail
        state_google = generate_oauth_state("google")
        profile_google = {
            "id": "link_google_456",
            "email": "linking_user@example.com",
            "name": "Alex Silva Google",
            "avatar_url": "https://lh3.googleusercontent.com/a/2",
            "username": "alexgoogle",
        }
        with patch(
            "app.auth.providers.google_provider.exchange_code",
            new_callable=AsyncMock,
            return_value="tok2",
        ), patch(
            "app.auth.providers.google_provider.get_user_profile",
            new_callable=AsyncMock,
            return_value=profile_google,
        ):
            self.client.get(
                f"/auth/google/callback?code=code2&state={state_google}",
                follow_redirects=False,
            )

        # 3. Verifica no banco: deve haver apenas 1 User com 2 OAuthAccounts
        db = next(get_db())
        try:
            users = (
                db.query(User).filter(User.email == "linking_user@example.com").all()
            )
            self.assertEqual(len(users), 1, "Não deve duplicar o usuário com mesmo e-mail!")
            user = users[0]

            accounts = (
                db.query(OAuthAccount).filter(OAuthAccount.user_id == user.id).all()
            )
            self.assertEqual(len(accounts), 2, "Deve vincular as duas contas OAuth!")
            providers = {a.provider for a in accounts}
            self.assertEqual(providers, {"github", "google"})
        finally:
            db.close()

    def test_auth_me_unauthorized_without_token(self):
        """GET /auth/me sem token deve retornar 401 Unauthorized."""
        response = self.client.get("/auth/me")
        self.assertEqual(response.status_code, 401)

    def test_auth_me_authorized_with_token(self):
        """GET /auth/me com token JWT válido deve retornar perfil do usuário autenticado."""
        # Cria usuário no banco para o teste
        db = next(get_db())
        try:
            user = User(
                nome="Fulano",
                sobrenome="Silva",
                email="linking_user@example.com",
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            token = create_access_token({"sub": str(user.id), "email": user.email})

            response = self.client.get(
                "/auth/me",
                headers={"Authorization": f"Bearer {token}"},
            )
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["email"], "linking_user@example.com")
            self.assertEqual(data["nome"], "Fulano")
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
