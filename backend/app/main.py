from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config.settings import settings
from app.utils.response import error_response

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug
)

# 全局异常处理器
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """将HTTPException转换为统一的响应格式"""
    # 根据状态码设置错误代码
    error_code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED", 
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        422: "VALIDATION_ERROR",
        500: "INTERNAL_SERVER_ERROR"
    }
    
    error_code = error_code_map.get(exc.status_code, "UNKNOWN_ERROR")
    
    response_data = error_response(
        message=exc.detail,
        error_code=error_code
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=response_data.model_dump(),
        headers=getattr(exc, 'headers', None)
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