from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/banking_db"
    APP_NAME: str = "Banking API"

    model_config = {"env_file": ".env"}


settings = Settings()
