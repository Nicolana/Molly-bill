# Molly Bill - AI智能记账系统

一个基于AI的智能记账应用，帮助用户轻松管理个人财务。

## 功能特性

- 🤖 AI智能分类 - 自动识别和分类交易记录
- 💳 多账户管理 - 支持银行卡、现金、信用卡等
- 📊 数据分析 - 消费趋势分析和可视化图表
- 💰 预算管理 - 设置月度预算和分类预算
- 🔔 智能提醒 - 账单到期提醒和异常消费提醒
- 📱 响应式设计 - 支持桌面端和移动端

## 技术栈

### 前端
- Next.js 14 (React 18)
- TypeScript
- Tailwind CSS
- Shadcn/ui 组件库
- Recharts 图表库
- Zustand 状态管理

### 后端
- Python FastAPI
- SQLAlchemy ORM
- PostgreSQL 数据库
- OpenAI API (智能分类)
- JWT 认证
- Redis (缓存)

## 项目结构

```
Molly-bill/
├── frontend/          # Next.js 前端应用
├── backend/           # Python FastAPI 后端
├── landing-page/      # 产品落地页
└── docs/             # 项目文档
```

## 快速开始

### 前端开发
```bash
cd frontend
npm install
npm run dev
```

### 后端开发
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## 环境变量

创建 `.env.local` 文件：

```env
# 数据库
DATABASE_URL=postgresql://user:password@localhost/mollybill

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# JWT
JWT_SECRET=your_jwt_secret

# Redis
REDIS_URL=redis://localhost:6379
```

## 部署

- 前端: Vercel
- 后端: Railway
- 数据库: Supabase 