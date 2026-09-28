from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    database_url: str
    database_url_prod: Optional[str] = None
    clerk_secret_key: str
    clerk_publishable_key: Optional[str] = None
    clerk_jwt_issuer: str = "https://adapted-squirrel-3042.clerk.accounts.dev"
    app_env: str = "development"
    log_level: str = "info"
    # CORS allowed origins — comma-separated list.
    # Default is localhost-only (safe for local development).
    # In production, set ALLOWED_ORIGINS explicitly in the environment to your
    # actual frontend domain(s), e.g.:
    #   ALLOWED_ORIGINS=https://coopsetu.example.com,https://www.coopsetu.example.com
    # Never use "*" in production — it allows any origin to make credentialed requests.
    allowed_origins: str = "http://localhost:3000,http://localhost:8000,http://127.0.0.1:3000,http://127.0.0.1:8000"
    gemini_api_key: Optional[str] = None
    openrouter_api_key: Optional[str] = None

    @property
    def origins_list(self):
        return [o.strip() for o in self.allowed_origins.split(",")]

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

@lru_cache
def get_settings() -> Settings:
    return Settings()
