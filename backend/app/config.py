# app/config.py
import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Base configuration
    APP_NAME: str = "Cold Email Generator"
    DEBUG: bool = True
    API_PREFIX: str = "/api"
    
    # Database configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./coldmail.db")
    
    # JWT Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Azure OpenAI configuration
    AZURE_OPENAI_API_KEY: Optional[str] = os.getenv("AZURE_OPENAI_API_KEY")
    AZURE_OPENAI_ENDPOINT: Optional[str] = os.getenv("AZURE_OPENAI_ENDPOINT")
    AZURE_OPENAI_API_VERSION: str = "2023-05-15"
    AZURE_OPENAI_DEPLOYMENT_NAME: str = "gpt-35-turbo"
    
    # User limits
    DEFAULT_MAX_COMPANIES: int = 5
    DEFAULT_MAX_WEBSITES_PER_EMAIL: int = 3
    DEFAULT_MAX_EMAILS_PER_DAY: int = 10
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()