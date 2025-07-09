# Molly Bill AI记账助手

一个基于AI的智能记账应用，支持文字、语音和图片输入，自动识别和记录账单信息。

## 功能特性

- 🤖 **AI智能识别**: 集成阿里百练qwen模型，智能识别账单信息
- 💬 **聊天界面**: 自然语言交互，像和朋友聊天一样记账
- 🎤 **语音输入**: 支持语音识别，说出账单信息即可记录
- 📷 **图片识别**: 拍照上传账单，AI自动提取信息
- 📊 **数据统计**: 可视化账单统计和分类分析
- 🔐 **用户认证**: 安全的用户注册和登录系统

## 技术栈

### 前端
- Next.js 15 + TypeScript
- Tailwind CSS
- Radix UI组件库
- Zustand状态管理
- Axios HTTP客户端

### 后端
- FastAPI + Python
- SQLAlchemy ORM
- SQLite数据库
- JWT认证
- 阿里百练AI服务

## 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd Molly-bill
```

### 2. 后端设置

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp env.example .env
# 编辑.env文件，添加你的阿里百练API密钥
```

### 3. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 4. 配置阿里百练API

1. 访问 [阿里百练官网](https://bailian.console.aliyun.com/)
2. 注册账号并获取API密钥
3. 在backend/.env文件中设置：
```
DASHSCOPE_API_KEY=your-actual-api-key
```

### 5. 启动应用

```bash
# 启动后端 (在backend目录)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 启动前端 (在frontend目录)
npm run dev
```

访问 http://localhost:3000 开始使用！

## 使用说明

### 注册和登录
1. 访问应用首页
2. 点击"注册"创建新账户
3. 使用邮箱和密码登录

### AI记账助手
1. 登录后进入"AI助手"标签页
2. 可以通过以下方式记录账单：
   - **文字输入**: 直接输入如"今天在星巴克花了35元"
   - **语音输入**: 点击麦克风按钮，说出账单信息
   - **图片上传**: 点击相机按钮，上传账单照片

### 查看账单记录
1. 切换到"账单记录"标签页
2. 查看所有记录的账单
3. 查看统计信息和分类分析

## API端点

### 认证相关
- `POST /register` - 用户注册
- `POST /token` - 用户登录
- `GET /me` - 获取当前用户信息

### 账单相关
- `GET /bills/` - 获取账单列表
- `POST /bills/` - 创建新账单
- `DELETE /bills/{id}` - 删除账单

### AI相关
- `POST /ai/chat` - AI聊天对话
- `POST /ai/voice` - 语音识别
- `POST /ai/image` - 图片分析
- `POST /ai/analyze` - 综合分析（文本/图片/音频）

## 开发说明

### 项目结构
```
Molly-bill/
├── backend/                 # FastAPI后端
│   ├── main.py             # 主应用文件
│   ├── ai_service.py       # AI服务模块
│   ├── models.py           # 数据库模型
│   ├── schemas.py          # Pydantic模型
│   ├── crud.py             # 数据库操作
│   ├── deps.py             # 依赖注入
│   └── requirements.txt    # Python依赖
├── frontend/               # Next.js前端
│   ├── src/
│   │   ├── app/           # 页面组件
│   │   ├── components/    # UI组件
│   │   ├── lib/           # 工具函数
│   │   ├── store/         # 状态管理
│   │   └── types/         # TypeScript类型
│   └── package.json       # Node.js依赖
└── README.md              # 项目说明
```

### 环境变量
- `DATABASE_URL`: 数据库连接字符串
- `SECRET_KEY`: JWT密钥
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token过期时间
- `DASHSCOPE_API_KEY`: 阿里百练API密钥

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License 