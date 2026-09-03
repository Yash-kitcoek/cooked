from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    allowed_origins: str = "http://localhost:5173"
    upload_dir: str = "/data/uploads"
    max_upload_bytes: int = 5 * 1024 * 1024
    sla_check_interval_seconds: int = 300
    # Only enable behind a proxy that overwrites X-Forwarded-For. If the header
    # is client-reachable, trusting it lets anyone bypass the rate limiter.
    trust_proxy_headers: bool = False
    admin_username: str | None = "admin"
    admin_email: str | None = None
    admin_password: str | None = None
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from: str | None = None
    oidc_issuer: str | None = None
    oidc_client_id: str | None = None
    oidc_client_secret: str | None = None
    hf_token: str | None = None
    hf_model: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("jwt_secret")
    @classmethod
    def validate_jwt_secret(cls, value: str) -> str:
        if len(value) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters")
        return value

    @field_validator("smtp_host", "smtp_username", "smtp_password", "smtp_from", "oidc_issuer", "oidc_client_id", "oidc_client_secret", mode="before")
    @classmethod
    def blank_optional_values_are_none(cls, value: str | None) -> str | None:
        return value or None

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def upload_path(self) -> Path:
        return Path(self.upload_dir)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
