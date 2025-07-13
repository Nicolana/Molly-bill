# 使用官方Python 3.11镜像
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 复制requirements文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建非root用户并设置文件所有权
RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app

USER app

# 暴露端口
EXPOSE 8000

# 启动命令：使用Python启动脚本
CMD ["python", "startup.py"] 