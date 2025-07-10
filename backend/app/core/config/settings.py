from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # 应用配置
    app_name: str = "Molly Bill API"
    app_version: str = "1.0.0"
    debug: bool = True
    
    # 数据库配置
    database_url: str = "sqlite:///./test.db"
    
    # JWT配置
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS配置
    allowed_origins: list = ["*"]
    allowed_credentials: bool = True
    allowed_methods: list = ["*"]
    allowed_headers: list = ["*"]
    
    # 邀请配置
    invitation_expire_hours: int = 24
    
    # 回收站配置
    recycle_bin_expire_days: int = 90
    
    # AI服务配置
    dashscope_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings() 