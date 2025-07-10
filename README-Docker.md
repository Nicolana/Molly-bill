# Molly Bill Docker 部署指南

本项目提供了完整的 Docker 部署方案，支持开发环境和生产环境。

## 项目结构

```
Molly-bill/
├── docker-compose.yml          # 开发环境配置
├── docker-compose.prod.yml     # 生产环境配置
├── nginx.conf                  # 开发环境 Nginx 配置
├── nginx.prod.conf             # 生产环境 Nginx 配置
├── backend/
│   ├── Dockerfile              # 后端开发环境 Dockerfile
│   ├── Dockerfile.prod         # 后端生产环境 Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile              # 前端开发环境 Dockerfile
│   ├── Dockerfile.prod         # 前端生产环境 Dockerfile
│   └── .dockerignore
└── .dockerignore
```

## 服务架构

- **PostgreSQL**: 数据库服务
- **Backend**: FastAPI 后端服务
- **Frontend**: Next.js 前端服务
- **Nginx**: 反向代理和负载均衡

## 快速开始

### 1. 环境准备

确保已安装：
- Docker
- Docker Compose

### 2. 配置环境变量

复制环境变量示例文件：
```bash
cp env.example .env
```

编辑 `.env` 文件，配置必要的环境变量：
```bash
# 数据库配置
POSTGRES_DB=molly_bill
POSTGRES_USER=molly_user
POSTGRES_PASSWORD=your-secure-password

# JWT配置
SECRET_KEY=your-super-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 阿里百练API配置
DASHSCOPE_API_KEY=your-dashscope-api-key-here

# 前端配置
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. 开发环境部署

```bash
# 构建并启动所有服务
docker-compose up --build

# 后台运行
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 4. 生产环境部署

```bash
# 构建并启动生产环境
docker-compose -f docker-compose.prod.yml up --build -d

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 停止服务
docker-compose -f docker-compose.prod.yml down
```

## 访问地址

### 开发环境
- 前端: http://localhost:3000
- 后端 API: http://localhost:8000
- 数据库: localhost:5432

### 生产环境
- 前端: https://your-domain.com
- 后端 API: https://your-domain.com/api/
- 数据库: 内部网络访问

## SSL 证书配置（生产环境）

1. 创建 SSL 目录：
```bash
mkdir ssl
```

2. 将 SSL 证书文件放入 `ssl` 目录：
- `ssl/cert.pem` - SSL 证书
- `ssl/key.pem` - SSL 私钥

3. 启动生产环境服务

## 数据库管理

### 查看数据库
```bash
# 进入 PostgreSQL 容器
docker-compose exec postgres psql -U molly_user -d molly_bill

# 或者使用外部工具连接
# Host: localhost
# Port: 5432
# Database: molly_bill
# Username: molly_user
# Password: molly_password
```

### 备份数据库
```bash
docker-compose exec postgres pg_dump -U molly_user molly_bill > backup.sql
```

### 恢复数据库
```bash
docker-compose exec -T postgres psql -U molly_user molly_bill < backup.sql
```

## 常用命令

### 查看服务状态
```bash
docker-compose ps
```

### 重启特定服务
```bash
docker-compose restart backend
```

### 查看服务日志
```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs backend

# 实时查看日志
docker-compose logs -f frontend
```

### 进入容器
```bash
# 进入后端容器
docker-compose exec backend bash

# 进入前端容器
docker-compose exec frontend sh

# 进入数据库容器
docker-compose exec postgres psql -U molly_user -d molly_bill
```

### 清理资源
```bash
# 停止并删除容器
docker-compose down

# 停止并删除容器、网络、镜像
docker-compose down --rmi all

# 停止并删除容器、网络、镜像、数据卷
docker-compose down --rmi all -v
```

## 故障排除

### 1. 端口冲突
如果端口被占用，可以修改 `docker-compose.yml` 中的端口映射：
```yaml
ports:
  - "3001:3000"  # 将主机端口改为 3001
```

### 2. 数据库连接失败
检查数据库服务是否正常启动：
```bash
docker-compose logs postgres
```

### 3. 前端构建失败
检查 Node.js 依赖是否正确安装：
```bash
docker-compose exec frontend pnpm install
```

### 4. 后端启动失败
检查 Python 依赖是否正确安装：
```bash
docker-compose exec backend pip install -r requirements.txt
```

## 性能优化

### 1. 数据库优化
- 调整 PostgreSQL 配置参数
- 添加数据库索引
- 定期清理日志

### 2. 前端优化
- 启用 Gzip 压缩
- 配置静态文件缓存
- 使用 CDN

### 3. 后端优化
- 调整 uvicorn 工作进程数
- 配置连接池
- 启用缓存

## 安全建议

1. **更改默认密码**：修改数据库和 JWT 密钥
2. **使用 HTTPS**：生产环境必须启用 SSL
3. **限制网络访问**：只开放必要的端口
4. **定期更新**：保持 Docker 镜像和依赖包最新
5. **备份数据**：定期备份数据库

## 监控和日志

### 查看应用日志
```bash
# 查看所有服务日志
docker-compose logs

# 查看特定时间段的日志
docker-compose logs --since="2024-01-01T00:00:00"
```

### 监控资源使用
```bash
# 查看容器资源使用情况
docker stats

# 查看磁盘使用情况
docker system df
```

## 扩展部署

### 添加 Redis 缓存
在 `docker-compose.yml` 中添加：
```yaml
redis:
  image: redis:7-alpine
  container_name: molly-bill-redis
  networks:
    - molly-bill-network
```

### 添加监控服务
可以集成 Prometheus 和 Grafana 进行监控。

## 支持

如果遇到问题，请检查：
1. Docker 和 Docker Compose 版本
2. 环境变量配置
3. 网络连接
4. 日志输出

更多信息请参考项目文档或提交 Issue。 