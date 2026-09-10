"""Módulo de Autenticação OAuth 2.0 e JWT para FastAPI."""

from app.auth.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    DEBUG,
    ENVIRONMENT,
    FRONTEND_URL,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_REDIRECT_URI,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    JWT_ALGORITHM,
    JWT_SECRET_KEY,
)
from app.auth.providers import (
    GitHubOAuthProvider,
    GoogleOAuthProvider,
    github_provider,
    google_provider,
)
from app.auth.router import router as auth_router
from app.auth.security import (
    create_access_token,
    decode_access_token,
    generate_oauth_state,
    get_current_user,
    oauth2_scheme,
    parse_oauth_name,
    sanitize_avatar_url,
    sanitize_text,
    validate_redirect_url,
    verify_oauth_state,
)
from app.auth.service import AuthService, auth_service

__all__ = [
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
    "ENVIRONMENT",
    "DEBUG",
]
