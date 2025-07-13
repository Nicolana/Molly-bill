#!/bin/bash

# 等待数据库准备就绪
echo "等待数据库准备就绪..."
python -c "
import time
import sys
from sqlalchemy import create_engine
from app.core.config.settings import settings

max_retries = 30
retry_count = 0

while retry_count < max_retries:
    try:
        engine = create_engine(settings.database_url)
        connection = engine.connect()
        connection.close()
        print('数据库连接成功！')
        break
    except Exception as e:
        retry_count += 1
        print(f'数据库连接失败 ({retry_count}/{max_retries}): {e}')
        if retry_count >= max_retries:
            print('数据库连接超时，退出')
            sys.exit(1)
        time.sleep(2)
"

# 运行数据库迁移
echo "运行数据库迁移..."
python manage_db.py init

# 启动应用
echo "启动应用..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 