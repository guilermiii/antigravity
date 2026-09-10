import os
from pathlib import Path


def _load_env() -> None:
    """Carrega variáveis do arquivo .env da raiz do projeto se existir."""
    env_file = Path(__file__).resolve().parent.parent.parent / ".env"
    if not env_file.is_file():
        return

    try:
        from dotenv import load_dotenv

        load_dotenv(dotenv_path=env_file)
    except ImportError:
        # Fallback resiliente caso python-dotenv não esteja instalado
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                if k not in os.environ:
                    os.environ[k] = v


_load_env()

# Configurações de Ambiente
ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

# Configurações de JWT
JWT_SECRET_KEY: str = os.getenv(
    "JWT_SECRET_KEY",
    "antigravity_super_secret_jwt_key_development_only_change_in_production_32bytes",
)
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
)

# Origem do Frontend para Redirecionamentos e CORS
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")

# Configurações OAuth2 - GitHub
GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "mock_github_client_id")
GITHUB_CLIENT_SECRET: str = os.getenv(
    "GITHUB_CLIENT_SECRET", "mock_github_client_secret"
)
GITHUB_REDIRECT_URI: str = os.getenv(
    "GITHUB_REDIRECT_URI", "http://localhost:8000/auth/github/callback"
)

# Configurações OAuth2 - Google
GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "mock_google_client_id")
GOOGLE_CLIENT_SECRET: str = os.getenv(
    "GOOGLE_CLIENT_SECRET", "mock_google_client_secret"
)
GOOGLE_REDIRECT_URI: str = os.getenv(
    "GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback"
)
