"""App configuration. Load from env; override in tests or for VS Code extension."""
import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from server root (or project root if running from there)
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path)
load_dotenv()  # also allow project root .env


class Config:
    """Base config. Override per environment."""

    # Flask
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
    ENV = os.environ.get("FLASK_ENV", "development")
    DEBUG = os.environ.get("FLASK_DEBUG", "1").lower() in ("1", "true", "yes")

    # API – same surface for frontend and VS Code extension
    API_PREFIX = os.environ.get("API_PREFIX", "/api/v1")

    # CORS – allow frontend origin (strip whitespace so .env entries are safe)
    _cors_default = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080"
    _cors_raw = os.environ.get("CORS_ORIGINS", _cors_default)
    CORS_ORIGINS = [o.strip() for o in _cors_raw.split(",") if o.strip()] or _cors_default.split(",")

    # GitHub API – optional token for higher rate limits (60/hr without, 5000/hr with)
    GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")

    # Firebase Admin – for Firestore + verifying frontend ID tokens
    FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "")
    GOOGLE_APPLICATION_CREDENTIALS = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False
    ENV = "production"


class TestConfig(Config):
    TESTING = True


_config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestConfig,
}


def get_config(env: str | None = None) -> type[Config]:
    """Return config class for the given env (default from FLASK_ENV)."""
    name = (env or os.environ.get("FLASK_ENV") or "development").lower()
    return _config_by_name.get(name, DevelopmentConfig)
