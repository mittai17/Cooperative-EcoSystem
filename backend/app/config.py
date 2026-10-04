from pydantic import field_validator
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
    # Demo login for the mobile app (SIH judges). OFF unless explicitly enabled.
    # When true, POST /api/v1/auth/demo-login mints short-lived Clerk sign-in
    # tokens for the fixed allowlisted demo accounts only (see app/demo_users.py).
    # Never enable in a production deployment that holds real users.
    demo_login_enabled: bool = False
    demo_login_rate_limit_per_minute: int = 10
    demo_ticket_ttl_seconds: int = 300

    # ------------------------------------------------------------------
    # Optional integrations. Every value is Optional and unset by default;
    # with all of them unset the server must start and no endpoint may 500
    # (features degrade to "not configured"). See GET /api/v1/system/integrations
    # and docs/mobile-api.md. Never log or return these values.
    # ------------------------------------------------------------------
    youtube_api_key: Optional[str] = None
    adzuna_app_id: Optional[str] = None
    adzuna_app_key: Optional[str] = None
    jooble_api_key: Optional[str] = None
    bhashini_user_id: Optional[str] = None
    bhashini_api_key: Optional[str] = None
    # Face recognition (InsightFace model pack name/path, e.g. "buffalo_s").
    face_model_pack: Optional[str] = None
    face_match_threshold: Optional[float] = None
    face_min_det_score: Optional[float] = None
    # Public base URL where uploaded/served media is reachable by the app.
    media_base_url: Optional[str] = None
    # Path to a Firebase service-account JSON file (never the JSON itself).
    fcm_service_account_file: Optional[str] = None
    # Shared secret for scheduled jobs (job sync, push flush) hitting cron endpoints.
    cron_secret: Optional[str] = None
    internal_api_secret: Optional[str] = None
    certificate_signing_secret: Optional[str] = None
    # When unset: true only if APP_ENV=development. See `anonymous_actor_allowed`.
    # An explicit value always wins. Lets unauthenticated callers act as the
    # trainee/applicant id they pass in (scripts, tests). Off in production.
    allow_anonymous_actor: Optional[bool] = None

    @property
    def anonymous_actor_allowed(self) -> bool:
        if self.allow_anonymous_actor is not None:
            return bool(self.allow_anonymous_actor)
        return (self.app_env or "").strip().lower() == "development"

    @field_validator(
        "youtube_api_key", "adzuna_app_id", "adzuna_app_key",
        "jooble_api_key", "bhashini_user_id", "bhashini_api_key", "face_model_pack",
        "face_match_threshold", "face_min_det_score", "media_base_url",
        "fcm_service_account_file", "cron_secret", "internal_api_secret", "certificate_signing_secret", "allow_anonymous_actor",
        mode="before",
    )
    @classmethod
    def _blank_is_unset(cls, v):
        """`NAME=` (empty) in an env file means "not configured", not an error."""
        if isinstance(v, str) and not v.strip():
            return None
        return v

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
