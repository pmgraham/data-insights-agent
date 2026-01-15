from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # Google Cloud
    google_cloud_project: str = Field(..., env="GOOGLE_CLOUD_PROJECT")
    google_cloud_region: str = Field(default="us-central1", env="GOOGLE_CLOUD_REGION")

    # BigQuery
    bigquery_dataset: str = Field(..., env="BIGQUERY_DATASET")

    # Server
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    debug: bool = Field(default=False, env="DEBUG")

    # CORS
    cors_origins: str = Field(
        default="http://localhost:5173,http://localhost:3000",
        env="CORS_ORIGINS"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
