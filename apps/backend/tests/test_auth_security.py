import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.database import Base, engine, get_db
from app.main import app
from app.models import OAuthAccount, User


class TestAuthSecurity(unittest.TestCase):
    """Suite de testes focada estritamente em segurança e blindagem contra vulnerabilidades."""

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)

    def setUp(self):
        self.client = TestClient(app)

    # -------------------------------------------------------------
    # 1. SQL Injection (SQLi) Defense Tests
    # -------------------------------------------------------------

    def test_sqli_in_state_parameter_blocked(self):
        """Injeção de SQL no parâmetro state não deve quebrar query nem expor dados."""
        sqli_payloads = [
            "' OR '1'='1",
            "admin'--",
            "'; DROP TABLE users; --",
            "' UNION SELECT id, email FROM users --",
            "1; SELECT pg_sleep(1);",
        ]
        for payload in sqli_payloads:
            response = self.client.get(
                f"/auth/github/callback?code=mock_code&state={payload}",
                follow_redirects=False,
            )
            # Deve rejeitar como requisição inválida / state inválido (400)
            self.assertEqual(
                response.status_code,
                400,
                f"Falha de segurança: payload SQLi '{payload}' não retornou 400 Bad Request",
            )
            self.assertIn("State inválido", response.text)

    def test_sqli_in_code_parameter_blocked(self):
        """Injeção de SQL no parâmetro code não deve afetar a execução nem o banco."""
        payload = "' OR 1=1; --"
        # Gerar state válido para testar injeção especificamente no code
        from app.auth.security import generate_oauth_state

        valid_state = generate_oauth_state("github")

        with patch("app.auth.service.auth_service.process_oauth_callback") as mock_proc:
            mock_proc.side_effect = ValueError("Código de autorização inválido")
            response = self.client.get(
                f"/auth/github/callback?code={payload}&state={valid_state}",
                follow_redirects=False,
            )
            self.assertEqual(response.status_code, 400)

    def test_sqli_in_bearer_token_blocked(self):
        """Injeção de SQL no header Authorization não deve quebrar autenticação."""
        sqli_tokens = [
            "Bearer ' OR 1=1 --",
            "Bearer ' UNION SELECT 1, 'admin', 'admin@example.com' --",
        ]
        for auth_header in sqli_tokens:
            response = self.client.get(
                "/auth/me",
                headers={"Authorization": auth_header},
            )
            self.assertEqual(response.status_code, 401)

    def test_sqli_in_oauth_profile_data_escaped(self):
        """Dados de perfil retornados pelo provedor contendo SQLi são persistidos com segurança."""
        from app.auth.security import generate_oauth_state

        state = generate_oauth_state("github")

        # Provedor OAuth simulado retornando payload malicioso no nome e email
        mock_profile = {
            "id": "9999999",
            "email": "hacker@testsqli.com",
            "name": "'; DROP TABLE oauth_accounts; --",
            "avatar_url": "https://avatars.githubusercontent.com/u/9999999",
            "username": "hacker_sql",
        }

        with patch(
            "app.auth.providers.github_provider.exchange_code",
            new_callable=AsyncMock,
            return_value="mock_token",
        ), patch(
            "app.auth.providers.github_provider.get_user_profile",
            new_callable=AsyncMock,
            return_value=mock_profile,
        ):
            response = self.client.get(
                f"/auth/github/callback?code=mock_code&state={state}",
                follow_redirects=False,
            )
            # Deve processar e redirecionar com segurança (302/307)
            self.assertIn(response.status_code, [302, 307])

            # Verificar que a tabela oauth_accounts continua existindo e o nome foi tratado com prepared statement
            db = next(get_db())
            try:
                user = db.query(User).filter(User.email == "hacker@testsqli.com").first()
                self.assertIsNotNone(user)
                # O banco não executou o DROP TABLE!
                oauth = (
                    db.query(OAuthAccount)
                    .filter(OAuthAccount.provider_user_id == "9999999")
                    .first()
                )
                self.assertIsNotNone(oauth)
            finally:
                # Limpeza
                if user:
                    db.delete(user)
                    db.commit()
                db.close()

    # -------------------------------------------------------------
    # 2. Script Injection (XSS) Defense Tests
    # -------------------------------------------------------------

    def test_xss_in_oauth_name_sanitized(self):
        """Payloads de XSS no nome retornado do perfil são devidamente sanitizados."""
        from app.auth.security import generate_oauth_state

        state = generate_oauth_state("google")

        mock_profile = {
            "id": "8888888",
            "email": "xss_tester@example.com",
            "name": "<script>alert('XSS')</script>Tester",
            "avatar_url": "https://lh3.googleusercontent.com/a/test",
            "username": "tester",
        }

        with patch(
            "app.auth.providers.google_provider.exchange_code",
            new_callable=AsyncMock,
            return_value="mock_token",
        ), patch(
            "app.auth.providers.google_provider.get_user_profile",
            new_callable=AsyncMock,
            return_value=mock_profile,
        ):
            response = self.client.get(
                f"/auth/google/callback?code=mock_code&state={state}",
                follow_redirects=False,
            )
            self.assertIn(response.status_code, [302, 307])

            db = next(get_db())
            try:
                user = db.query(User).filter(User.email == "xss_tester@example.com").first()
                self.assertIsNotNone(user)
                # Verifica que a tag script foi neutralizada/removida do nome
                self.assertNotIn("<script>", user.nome)
            finally:
                if user:
                    db.delete(user)
                    db.commit()
                db.close()

    def test_xss_in_avatar_url_blocked(self):
        """URL de avatar com pseudo-protocolo javascript: deve ser rejeitada ou neutralizada."""
        from app.auth.security import sanitize_avatar_url

        evil_urls = [
            "javascript:alert(1)",
            "JAVASCRIPT:alert('xss')",
            "data:text/html,<script>alert(1)</script>",
            "vbscript:msgbox(1)",
        ]
        for url in evil_urls:
            safe = sanitize_avatar_url(url)
            self.assertIsNone(safe, f"Falha ao bloquear URL maliciosa de avatar: {url}")

        # URL válida HTTPS deve ser aceita
        good_url = "https://avatars.githubusercontent.com/u/12345"
        self.assertEqual(sanitize_avatar_url(good_url), good_url)

    # -------------------------------------------------------------
    # 3. CSRF & State Tampering Tests
    # -------------------------------------------------------------

    def test_callback_without_state_rejected(self):
        """Tentativa de callback sem parâmetro state deve ser rejeitada com 400."""
        response = self.client.get(
            "/auth/github/callback?code=mock_code",
            follow_redirects=False,
        )
        self.assertEqual(response.status_code, 400)

    def test_callback_with_forged_state_rejected(self):
        """State forjado sem chave secreta válida é rejeitado."""
        response = self.client.get(
            "/auth/github/callback?code=mock_code&state=forged.state.signature",
            follow_redirects=False,
        )
        self.assertEqual(response.status_code, 400)

    # -------------------------------------------------------------
    # 4. Token Tampering & Alg: None Attack Tests
    # -------------------------------------------------------------

    def test_jwt_alg_none_attack_rejected(self):
        """Ataque clássico JWT 'alg: none' deve ser categoricamente rejeitado."""
        # Header com alg: none em base64: {"alg": "none", "typ": "JWT"} -> eyJhbGciOiAibm9uZSIgfQ
        # Payload com id de admin: {"sub": "1", "email": "admin@example.com"} -> eyJzdWIiOiAiMSIsICJlbWFpbCI6ICJhZG1pbkBleGFtcGxlLmNvbSJ9
        fake_token = "eyJhbGciOiAibm9uZSIsICJ0eXAiOiAiSldUIn0.eyJzdWIiOiAiMSIsICJlbWFpbCI6ICJhZG1pbkBleGFtcGxlLmNvbSJ9."
        response = self.client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {fake_token}"},
        )
        self.assertEqual(response.status_code, 401)

    # -------------------------------------------------------------
    # 5. Open Redirect Protection Tests
    # -------------------------------------------------------------

    def test_open_redirect_attack_blocked(self):
        """Tentativa de redirecionar para domínio externo malicioso deve ser impedida."""
        from app.auth.security import validate_redirect_url

        malicious_urls = [
            "https://evil-phishing.com",
            "http://attacker.org/steal-token",
            "//evil.com",
            "javascript:window.location='http://evil.com'",
        ]
        for url in malicious_urls:
            is_valid = validate_redirect_url(url)
    # -------------------------------------------------------------
    # 6. Unauthenticated CRUD Operations Defense Tests (Business Rule)
    # -------------------------------------------------------------

    def test_unauthenticated_post_users_blocked_401(self):
        """Tentativa de cadastrar usuário sem autenticação deve ser bloqueada com 401 Unauthorized."""
        payload = {
            "nome": "Tentativa",
            "sobrenome": "Anonima",
            "email": "anonimo@example.com",
        }
        response = self.client.post("/users/", json=payload)
        self.assertEqual(response.status_code, 401)
        self.assertIn("Autenticação necessária", response.text)

    def test_unauthenticated_get_users_blocked_401(self):
        """Tentativa de listar usuários sem autenticação deve ser bloqueada com 401 Unauthorized."""
        response = self.client.get("/users/")
        self.assertEqual(response.status_code, 401)
        self.assertIn("Autenticação necessária", response.text)

    def test_unauthenticated_get_user_by_id_blocked_401(self):
        """Tentativa de buscar usuário por ID sem autenticação deve ser bloqueada com 401 Unauthorized."""
        response = self.client.get("/users/1")
        self.assertEqual(response.status_code, 401)
        self.assertIn("Autenticação necessária", response.text)

    def test_unauthenticated_put_user_blocked_401(self):
        """Tentativa de atualizar usuário sem autenticação deve ser bloqueada com 401 Unauthorized."""
        response = self.client.put("/users/1", json={"nome": "Alterado"})
        self.assertEqual(response.status_code, 401)
        self.assertIn("Autenticação necessária", response.text)

    def test_unauthenticated_delete_user_blocked_401(self):
        """Tentativa de deletar usuário sem autenticação deve ser bloqueada com 401 Unauthorized."""
        response = self.client.delete("/users/1")
        self.assertEqual(response.status_code, 401)
        self.assertIn("Autenticação necessária", response.text)


if __name__ == "__main__":
    unittest.main()
