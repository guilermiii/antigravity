import time
import unittest
from unittest.mock import patch

from app.auth.security import (
    create_access_token,
    decode_access_token,
    generate_oauth_state,
    parse_oauth_name,
    sanitize_text,
    verify_oauth_state,
)


class TestAuthUnit(unittest.TestCase):
    """Testes unitários para utilitários de segurança e OAuth2."""

    def test_generate_and_verify_valid_state(self):
        """State válido para um provedor deve ser verificado com sucesso."""
        state = generate_oauth_state(provider="github")
        self.assertIsInstance(state, str)
        self.assertTrue(len(state) > 20)

        # Verificação deve ser verdadeira
        self.assertTrue(verify_oauth_state(state, expected_provider="github"))

    def test_verify_state_wrong_provider_fails(self):
        """State gerado para o GitHub deve falhar se verificado para o Google."""
        state = generate_oauth_state(provider="github")
        self.assertFalse(verify_oauth_state(state, expected_provider="google"))

    def test_verify_tampered_state_fails(self):
        """State adulterado por um atacante deve falhar na validação da assinatura HMAC."""
        state = generate_oauth_state(provider="github")
        tampered_state = state[:-4] + "fake"
        self.assertFalse(verify_oauth_state(tampered_state, expected_provider="github"))

    def test_verify_expired_state_fails(self):
        """State com timestamp expirado deve ser rejeitado."""
        # Simula criação de state há 20 minutos atrás (expira em 10 minutos)
        past_time = time.time() - 1200
        with patch("time.time", return_value=past_time):
            state = generate_oauth_state(provider="github")

        # Ao verificar no tempo presente, deve falhar por expiração
        self.assertFalse(verify_oauth_state(state, expected_provider="github"))

    def test_verify_empty_or_malformed_state(self):
        """States nulos, vazios ou em formato inesperado devem falhar graciosamente."""
        self.assertFalse(verify_oauth_state("", expected_provider="github"))
        self.assertFalse(verify_oauth_state("invalid.token", expected_provider="github"))
        self.assertFalse(verify_oauth_state(None, expected_provider="github"))
        self.assertFalse(verify_oauth_state("a.b.c.d", expected_provider="github"))

    def test_jwt_create_and_decode_valid(self):
        """Token JWT criado deve ser decodificado corretamente com os claims informados."""
        payload = {"sub": "123", "email": "dev@example.com"}
        token = create_access_token(payload)
        decoded = decode_access_token(token)

        self.assertIsNotNone(decoded)
        self.assertEqual(decoded["sub"], "123")
        self.assertEqual(decoded["email"], "dev@example.com")
        self.assertIn("exp", decoded)

    def test_jwt_expired_token_rejected(self):
        """Token JWT expirado deve ser rejeitado."""
        payload = {"sub": "123", "email": "dev@example.com"}
        token = create_access_token(payload, expires_delta_seconds=-10)
        decoded = decode_access_token(token)
        self.assertIsNone(decoded)

    def test_jwt_tampered_payload_rejected(self):
        """Token com assinatura ou payload adulterado deve ser rejeitado."""
        token = create_access_token({"sub": "123"})
        parts = token.split(".")
        if len(parts) == 3:
            tampered = f"{parts[0]}.eyJhZG1pbiI6dHJ1ZX0.{parts[2]}"
            self.assertIsNone(decode_access_token(tampered))

    def test_parse_oauth_name_full_name(self):
        """Nome completo deve ser dividido em nome e sobrenome."""
        nome, sobrenome = parse_oauth_name("Linus Torvalds", username="torvalds")
        self.assertEqual(nome, "Linus")
        self.assertEqual(sobrenome, "Torvalds")

    def test_parse_oauth_name_single_word(self):
        """Nome único deve usar sobrenome padrão ou username para satisfazer constraints."""
        nome, sobrenome = parse_oauth_name("Guilherme", username="guilermiii")
        self.assertEqual(nome, "Guilherme")
        self.assertTrue(len(sobrenome) >= 2)

    def test_parse_oauth_name_empty_or_none(self):
        """Nome nulo ou vazio deve fazer fallback para username ou valor padrão válido."""
        nome, sobrenome = parse_oauth_name(None, username="octocat")
        self.assertTrue(len(nome) >= 2)
        self.assertTrue(len(sobrenome) >= 2)

    def test_sanitize_text_removes_dangerous_characters(self):
        """Sanitização deve neutralizar tags de script e caracteres de controle perigosos."""
        dirty = "<script>alert('XSS')</script>João"
        clean = sanitize_text(dirty)
        self.assertNotIn("<script>", clean)
        self.assertIn("João", clean)

    def test_auth_package_exports(self):
        """O pacote app.auth deve expor classes, provedores e rotas públicas em __all__."""
        import app.auth as auth

        expected_exports = [
            "auth_router",
            "auth_service",
            "AuthService",
            "github_provider",
            "google_provider",
            "GitHubOAuthProvider",
            "GoogleOAuthProvider",
            "create_access_token",
            "decode_access_token",
            "generate_oauth_state",
            "verify_oauth_state",
            "get_current_user",
            "oauth2_scheme",
            "parse_oauth_name",
            "sanitize_avatar_url",
            "sanitize_text",
            "validate_redirect_url",
            "JWT_SECRET_KEY",
            "JWT_ALGORITHM",
            "ACCESS_TOKEN_EXPIRE_MINUTES",
            "FRONTEND_URL",
            "GITHUB_CLIENT_ID",
            "GITHUB_CLIENT_SECRET",
            "GITHUB_REDIRECT_URI",
            "GOOGLE_CLIENT_ID",
            "GOOGLE_CLIENT_SECRET",
            "GOOGLE_REDIRECT_URI",
        ]
        for symbol in expected_exports:
            self.assertTrue(
                hasattr(auth, symbol),
                f"Símbolo '{symbol}' não exportado pelo pacote app.auth",
            )
            self.assertIn(symbol, auth.__all__)

    def test_authorization_urls_encoded_correctly(self):
        """URLs de autorização devem codificar parâmetros de query de acordo com RFC 6749."""
        from app.auth import github_provider, google_provider

        gh_url = github_provider.get_authorization_url("state_test_gh")
        self.assertIn("state=state_test_gh", gh_url)
        self.assertNotIn(" ", gh_url, "URL do GitHub não deve conter espaços crus")

        google_url = google_provider.get_authorization_url("state_test_google")
        self.assertIn("state=state_test_google", google_url)
        # O escopo 'openid email profile' deve ser codificado com + ou %20, nunca espaço cru
        self.assertNotIn(" ", google_url, "URL do Google não deve conter espaços crus")
        self.assertTrue(
            "openid+email+profile" in google_url or "openid%20email%20profile" in google_url,
            "Escopo do Google deve estar codificado em formato application/x-www-form-urlencoded",
        )


if __name__ == "__main__":
    unittest.main()
