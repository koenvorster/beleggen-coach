"""App-instellingen via omgevingsvariabelen."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://beleggingsapp:beleggingsapp_dev@localhost:5432/beleggingsapp"
    redis_url: str = "redis://localhost:6379"
    debug: bool = False
    app_name: str = "Beleggingsapp API"
    app_version: str = "0.1.0"

    # Ollama — lokale AI runtime
    ollama_base_url: str = "http://localhost:11434"
    ollama_default_model: str = "llama3"
    ollama_timeout: float = 120.0

    # Keycloak — authenticatie
    keycloak_issuer: str = "http://localhost:8081/realms/beleggencoach"
    keycloak_client_id: str = "beleggencoach"
    auth_enabled: bool = True


settings = Settings()
