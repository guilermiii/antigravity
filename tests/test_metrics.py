"""Testes unitários e de integração para os endpoints e métricas do Prometheus."""

import unittest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.auth.security import get_current_user
from app.database import Base, engine, get_db
from app.main import app
from app.metrics import (
    APP_OAUTH_LOGINS_TOTAL,
    APP_USER_OPERATIONS_TOTAL,
    APP_USERS_TOTAL,
    HTTP_REQUEST_DURATION_SECONDS,
    HTTP_REQUESTS_TOTAL,
    get_db as metrics_get_db,
    record_oauth_login,
    record_user_operation,
    sync_users_gauge,
)


class TestPrometheusMetrics(unittest.TestCase):
    """Suíte de testes para observabilidade, telemetria e endpoints do Prometheus."""

    def setUp(self):
        self.mock_db = MagicMock()
        mock_user = MagicMock(id=1, email="test@metrics.com", is_active=True)
        app.dependency_overrides[get_db] = lambda: self.mock_db
        app.dependency_overrides[metrics_get_db] = lambda: self.mock_db
        app.dependency_overrides[get_current_user] = lambda: mock_user
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_metrics_endpoint_returns_200_and_openmetrics_format(self):
        """GET /metrics deve retornar 200 e payload compatível com Prometheus/OpenMetrics."""
        response = self.client.get("/metrics")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            "text/plain" in response.headers.get("content-type", "")
            or "openmetrics-text" in response.headers.get("content-type", "")
        )
        content = response.text
        self.assertIn("http_requests_total", content)
        self.assertIn("http_request_duration_seconds", content)
        self.assertIn("app_users_total", content)

    def test_http_request_metrics_recorded(self):
        """Requisições HTTP devem ser contabilizadas no contador http_requests_total."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)

        metrics_resp = self.client.get("/metrics")
        self.assertEqual(metrics_resp.status_code, 200)
        self.assertIn('endpoint="/"', metrics_resp.text)
        self.assertIn('method="GET"', metrics_resp.text)
        self.assertIn('status_code="200"', metrics_resp.text)

    def test_route_normalization_prevents_high_cardinality(self):
        """Rotas dinâmicas como /users/8888 devem ser normalizadas para /users/{user_id}."""
        # Configura mock para retornar 404 (usuário não encontrado)
        self.mock_db.query.return_value.filter.return_value.first.return_value = None

        response = self.client.get("/users/8888")
        self.assertEqual(response.status_code, 404)

        metrics_resp = self.client.get("/metrics")
        # O label do endpoint DEVE ser /users/{user_id}, NUNCA /users/8888
        self.assertIn('endpoint="/users/{user_id}"', metrics_resp.text)
        self.assertNotIn('endpoint="/users/8888"', metrics_resp.text)

    def test_unknown_path_normalized_to_not_found(self):
        """Rotas inexistentes que não dão match em nenhum template devem ser rotuladas como not_found."""
        response = self.client.get("/caminho/completamente/aleatorio/999")
        self.assertEqual(response.status_code, 404)

        metrics_resp = self.client.get("/metrics")
        self.assertIn('endpoint="not_found"', metrics_resp.text)
        self.assertNotIn('endpoint="/caminho/completamente/aleatorio/999"', metrics_resp.text)

    def test_health_check_healthy(self):
        """GET /health deve responder 200 OK com status saudável e conectividade com o banco."""
        self.mock_db.execute.return_value = MagicMock()
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["database"], "connected")
        self.assertIn("environment", data)
        self.assertIn("version", data)

    def test_health_check_database_failure(self):
        """GET /health deve retornar 503 Service Unavailable se o banco falhar."""
        self.mock_db.execute.side_effect = Exception("Conexão com PostgreSQL recusada")

        response = self.client.get("/health")
        self.assertEqual(response.status_code, 503)
        data = response.json()
        self.assertEqual(data["status"], "unhealthy")
        self.assertEqual(data["database"], "disconnected")
        self.assertIn("Conexão com PostgreSQL recusada", data["error"])

    def test_domain_metrics_helpers(self):
        """Funções de auxílio devem registrar operações de usuários e logins OAuth."""
        record_user_operation(operation="custom_test_op", status="success")
        record_oauth_login(provider="test_provider", status="testing")

        metrics_resp = self.client.get("/metrics")
        self.assertIn('operation="custom_test_op"', metrics_resp.text)
        self.assertIn('provider="test_provider"', metrics_resp.text)

    def test_sync_users_gauge(self):
        """sync_users_gauge deve consultar a tabela User e atualizar o Gauge app_users_total."""
        mock_sync_db = MagicMock()
        mock_sync_db.query.return_value.count.return_value = 42
        sync_users_gauge(mock_sync_db)

        metrics_resp = self.client.get("/metrics")
        self.assertIn("app_users_total 42.0", metrics_resp.text)


if __name__ == "__main__":
    unittest.main()
