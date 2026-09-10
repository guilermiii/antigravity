"""Módulo de observabilidade e métricas com instrumentação Prometheus."""

import os
import time
from typing import Optional

from fastapi import APIRouter, Depends, Response, status
from fastapi.responses import JSONResponse
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    Counter,
    Gauge,
    Histogram,
    generate_latest,
)
from sqlalchemy import text
from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.database import get_db

# ==============================================================================
# Coletores de Métricas Prometheus
# ==============================================================================

# 1. Vazão de Requisições HTTP
HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total acumulado de requisições HTTP processadas pela aplicação",
    ["method", "endpoint", "status_code"],
)

# 2. Histograma de Duração / Latência das Requisições HTTP (em segundos)
HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "http_request_duration_seconds",
    "Distribuição do tempo de resposta das requisições HTTP em segundos",
    ["method", "endpoint"],
    buckets=(
        0.005,
        0.01,
        0.025,
        0.05,
        0.075,
        0.1,
        0.25,
        0.5,
        0.75,
        1.0,
        2.5,
        5.0,
        10.0,
    ),
)

# 3. Conexões / Requisições HTTP Ativas em Processamento Concorrente
HTTP_REQUESTS_IN_PROGRESS = Gauge(
    "http_requests_in_progress",
    "Número atual de requisições HTTP em processamento concorrente",
    ["method"],
)

# 4. Total de Usuários Cadastrados no Banco de Dados
APP_USERS_TOTAL = Gauge(
    "app_users_total",
    "Número total de usuários cadastrados na base de dados",
)

# 5. Operações de CRUD de Usuários Realizadas
APP_USER_OPERATIONS_TOTAL = Counter(
    "app_user_operations_total",
    "Total acumulado de operações realizadas sobre usuários (criação, atualização, exclusão)",
    ["operation", "status"],
)

# 6. Autenticações OAuth2 Federadas
APP_OAUTH_LOGINS_TOTAL = Counter(
    "app_oauth_logins_total",
    "Total acumulado de tentativas e conclusões de autenticação OAuth2 federada",
    ["provider", "status"],
)


# ==============================================================================
# Funções Auxiliares de Atualização de Métricas
# ==============================================================================


def record_user_operation(operation: str, status: str) -> None:
    """Registra evento de operação de usuário no Prometheus."""
    APP_USER_OPERATIONS_TOTAL.labels(operation=operation, status=status).inc()


def record_oauth_login(provider: str, status: str) -> None:
    """Registra evento de login OAuth2 no Prometheus."""
    APP_OAUTH_LOGINS_TOTAL.labels(provider=provider, status=status).inc()


def sync_users_gauge(db: Session) -> None:
    """Sincroniza o Gauge app_users_total consultando a contagem atual no banco."""
    try:
        from app.models import User

        count = db.query(User).count()
        APP_USERS_TOTAL.set(count)
    except Exception as exc:
        print(f"[Prometheus] Erro ao sincronizar app_users_total: {exc}")


# ==============================================================================
# Middleware de Telemetria HTTP com Prevenção de Alta Cardinalidade
# ==============================================================================


class PrometheusMiddleware(BaseHTTPMiddleware):
    """Middleware para coleta automatizada de latência e contagem de requisições HTTP.

    Normaliza dinamicamente rotas parametrizadas (ex: /users/42 -> /users/{user_id})
    para impedir a proliferação excessiva de séries temporais (cardinality explosion).
    """

    async def dispatch(self, request: Request, call_next):
        method = request.method
        HTTP_REQUESTS_IN_PROGRESS.labels(method=method).inc()
        start_time = time.perf_counter()

        try:
            response = await call_next(request)
            status_code = response.status_code

            # Resolução da rota normalizada
            route = request.scope.get("route")
            if route and hasattr(route, "path"):
                endpoint = route.path
            elif status_code == 404:
                endpoint = "not_found"
            else:
                endpoint = request.url.path

            # Registro do tempo decorrido e incremento de contadores
            duration = time.perf_counter() - start_time
            HTTP_REQUEST_DURATION_SECONDS.labels(
                method=method, endpoint=endpoint
            ).observe(duration)
            HTTP_REQUESTS_TOTAL.labels(
                method=method, endpoint=endpoint, status_code=status_code
            ).inc()

            return response
        except Exception:
            # Em caso de exceção não tratada capturada pelo servidor
            duration = time.perf_counter() - start_time
            HTTP_REQUEST_DURATION_SECONDS.labels(
                method=method, endpoint="internal_error"
            ).observe(duration)
            HTTP_REQUESTS_TOTAL.labels(
                method=method, endpoint="internal_error", status_code=500
            ).inc()
            raise
        finally:
            HTTP_REQUESTS_IN_PROGRESS.labels(method=method).dec()


# ==============================================================================
# Roteador de Métricas e Health Check
# ==============================================================================

router = APIRouter(tags=["Monitoring"])


@router.get(
    "/metrics",
    summary="Exposição de Métricas para Scrape do Prometheus",
    description=(
        "Retorna as métricas da aplicação no padrão OpenMetrics / Prometheus. "
        "Consumido periodicamente pelo servidor Prometheus."
    ),
    response_class=Response,
)
def get_metrics() -> Response:
    """Endpoint oficial para scraping pelo Prometheus."""
    metrics_data = generate_latest()
    return Response(
        content=metrics_data,
        media_type=CONTENT_TYPE_LATEST,
    )


@router.get(
    "/health",
    summary="Health check com verificação de conectividade com o banco",
    description=(
        "Executa um probe de conectividade com o PostgreSQL ('SELECT 1') e "
        "retorna status 200 OK se tudo estiver operando ou 503 Service Unavailable em caso de indisponibilidade."
    ),
    responses={
        200: {"description": "Sistema e banco de dados operacionais."},
        503: {"description": "Falha na comunicação com o banco de dados."},
    },
)
def health_check(db: Session = Depends(get_db)):
    """Verificação detalhada de integridade e liveness/readiness da aplicação."""
    environment = os.getenv("ENVIRONMENT", "development")
    version = os.getenv("APP_VERSION", "2.2.0-dev")
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "environment": environment,
            "version": version,
        }
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(exc),
                "environment": environment,
                "version": version,
            },
        )
