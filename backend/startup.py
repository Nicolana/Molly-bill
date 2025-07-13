#!/usr/bin/env python3
"""
应用启动脚本
在启动应用前执行数据库迁移
"""

import time
import sys
import subprocess
import os
from sqlalchemy import create_engine
from app.core.config.settings import settings

def wait_for_database():
    """等待数据库准备就绪"""
    print("等待数据库连接...")
    max_retries = 30
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            engine = create_engine(settings.database_url)
            connection = engine.connect()
            connection.close()
            print("数据库连接成功!")
            return True
        except Exception as e:
            retry_count += 1
            print(f"数据库连接失败 ({retry_count}/{max_retries}): {e}")
            if retry_count >= max_retries:
                print("数据库连接超时，退出应用")
                return False
            time.sleep(2)
    
    return False

def run_migrations():
    """执行数据库迁移"""
    print("执行数据库迁移...")
    try:
        result = subprocess.run([
            sys.executable, "manage_db.py", "init"
        ], check=True, capture_output=True, text=True)
        print("数据库迁移成功!")
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"数据库迁移失败: {e}")
        print(f"错误输出: {e.stderr}")
        return False

def start_application():
    """启动应用"""
    print("启动应用...")
    try:
        # 使用 exec 替换当前进程
        os.execvp("uvicorn", [
            "uvicorn", 
            "app.main:app", 
            "--host", "0.0.0.0", 
            "--port", "8000"
        ])
    except Exception as e:
        print(f"启动应用失败: {e}")
        sys.exit(1)

def main():
    """主函数"""
    # 等待数据库
    if not wait_for_database():
        sys.exit(1)
    
    # 执行迁移
    if not run_migrations():
        sys.exit(1)
    
    # 启动应用
    start_application()

if __name__ == "__main__":
    main() 