from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os
from dotenv import load_dotenv
from pydantic import Field

# 加载.env文件
load_dotenv()

class Settings(BaseSettings):
    # 应用配置
    app_name: str = "Molly Bill API"
    app_version: str = "1.0.0"
    debug: bool = True
    
    # 数据库配置
    database_url: str = Field(default="sqlite:///./test.db", env="DATABASE_URL")
    
    # JWT配置
    secret_key: str = Field(default="your-secret-key-here", env="SECRET_KEY")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
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
    dashscope_api_key: Optional[str] = Field(default=None, env="DASHSCOPE_API_KEY")
    openai_api_key: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    
    model_config = SettingsConfigDict(
        env_file=".env", 
        extra="ignore",
        env_file_encoding='utf-8'
    )

settings = Settings() 