# Molly Bill Backend

## 项目结构

```
backend/
├── app/
│   ├── api/                    # API路由层
│   │   ├── v1/                # API版本1
│   │   │   ├── auth.py        # 认证相关API
│   │   │   ├── users.py       # 用户相关API
│   │   │   ├── ledgers.py     # 账本相关API
│   │   │   ├── bills.py       # 账单相关API
│   │   │   ├── invitations.py # 邀请相关API
│   │   │   └── chat.py        # 聊天相关API
│   │   └── admin/             # 管理员API
│   ├── core/                  # 核心配置
│   │   ├── config/           # 配置管理
│   │   │   └── settings.py   # 应用设置
│   │   └── security/         # 安全相关
│   │       └── auth.py       # 认证逻辑
│   ├── crud/                 # 数据库操作层
│   │   ├── user.py          # 用户CRUD
│   │   ├── ledger.py        # 账本CRUD
│   │   ├── invitation.py    # 邀请CRUD
│   │   ├── bill.py          # 账单CRUD
│   │   └── chat.py          # 聊天CRUD
│   ├── db/                  # 数据库配置
│   │   ├── database.py      # 数据库连接
│   │   └── migrate.py       # 数据库迁移
│   ├── models/              # 数据模型
│   │   └── base.py         # 所有数据库模型
│   ├── schemas/             # Pydantic模型
│   │   ├── base.py         # 基础响应模型
│   │   ├── user.py         # 用户相关模型
│   │   ├── ledger.py       # 账本相关模型
│   │   ├── invitation.py   # 邀请相关模型
│   │   ├── bill.py         # 账单相关模型
│   │   └── chat.py         # 聊天相关模型
│   ├── services/           # 业务服务层
│   │   ├── ai/            # AI服务
│   │   ├── ledger/        # 账本服务
│   │   └── invitation/    # 邀请服务
│   ├── utils/             # 工具函数
│   │   ├── response.py    # 响应工具
│   │   ├── email/         # 邮件工具
│   │   └── permissions/   # 权限检查
│   ├── main.py           # 主应用文件
│   └── __init__.py
├── run.py                # 启动脚本
├── requirements.txt      # 依赖文件
└── README.md            # 项目说明
```

## 主要功能模块

### 1. 用户管理
- 用户注册/登录
- 用户信息管理
- 用户权限控制

### 2. 账本管理
- 账本创建/删除
- 账本成员管理
- 账本权限控制
- 账本转让

### 3. 邀请系统
- 发送邀请
- 接受/拒绝邀请
- 邀请状态管理
- 邀请链接生成

### 4. 账单管理
- 账单CRUD操作
- 账单统计
- 账单权限控制

### 5. 聊天系统
- AI聊天
- 消息历史
- 账单识别

## 启动方式

1. 安装依赖：
```bash
pip install -r requirements.txt
```

2. 初始化数据库：
```bash
# 使用管理脚本（推荐）
python manage_db.py init

# 或使用 Alembic 命令
alembic upgrade head
```

3. 启动应用：
```bash
python run.py
```

## 数据库管理

本项目使用 Alembic 进行数据库迁移管理。

### 快速命令

```bash
# 查看数据库状态
python manage_db.py status

# 重置数据库
python manage_db.py reset

# 创建新迁移
python manage_db.py migrate "迁移描述"

# 应用迁移
python manage_db.py upgrade
```

### 详细说明

更多数据库迁移相关信息，请查看 [migrations/README.md](migrations/README.md)

## API文档

启动后访问：http://localhost:8000/docs

## 环境变量

创建 `.env` 文件：
```
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./test.db
DEBUG=true
```

## 开发规范

1. **代码组织**：按功能模块组织代码
2. **依赖注入**：使用FastAPI的依赖注入系统
3. **错误处理**：统一的错误响应格式
4. **权限控制**：严格的权限检查
5. **数据验证**：使用Pydantic进行数据验证 