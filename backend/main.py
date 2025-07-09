from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta

from database import engine
from models import Base
from schemas import User, UserCreate, Bill, BillCreate, Token
from crud import create_user, get_user_by_email, verify_password, get_bills, create_bill, delete_bill
from deps import create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES, get_db
from ai import classify_transaction

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Molly Bill API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"msg": "Molly Bill API 在线"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/register", response_model=User)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="邮箱已被注册")
    return create_user(db=db, user=user)

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_user_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/bills/", response_model=List[Bill])
async def read_bills(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    bills = get_bills(db, user_id=current_user.id, skip=skip, limit=limit)
    return bills

@app.post("/bills/", response_model=Bill)
async def create_user_bill(bill: BillCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 如果没有分类，使用AI自动分类
    if not bill.category and bill.description:
        bill.category = classify_transaction(bill.description, bill.amount)
    return create_bill(db=db, bill=bill, user_id=current_user.id)

@app.delete("/bills/{bill_id}")
async def delete_user_bill(bill_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    success = delete_bill(db=db, bill_id=bill_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="账单不存在")
    return {"message": "账单已删除"}

@app.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user 