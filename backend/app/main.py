from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config.settings import settings
from app.db.database import engine, Base

# 导入所有模型以确保表被创建
from app.models import User, Ledger, UserLedger, Invitation, Bill, ChatMessage

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug
)

# CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=settings.allowed_credentials,
    allow_methods=settings.allowed_methods,
    allow_headers=settings.allowed_headers,
)

# 导入路由
from app.api.v1 import auth, users, ledgers, bills, invitations, chat

# 注册路由
app.include_router(auth.router, prefix="/api/v1", tags=["认证"])
app.include_router(users.router, prefix="/api/v1/users", tags=["用户"])
app.include_router(ledgers.router, prefix="/api/v1/ledgers", tags=["账本"])
app.include_router(bills.router, prefix="/api/v1/bills", tags=["账单"])
app.include_router(invitations.router, prefix="/api/v1/invitations", tags=["邀请"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["聊天"])

@app.get("/", tags=["健康检查"])
def read_root():
    return {"message": f"{settings.app_name} 在线", "version": settings.app_version}

@app.get("/health", tags=["健康检查"])
def health_check():
    return {"status": "ok", "message": "健康检查通过"} 