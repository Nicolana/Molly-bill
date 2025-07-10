#!/usr/bin/env python3
"""
数据库管理脚本
提供常用的数据库操作命令
"""
import os
import sys
import subprocess
from pathlib import Path

def run_command(command, description):
    """运行命令并显示结果"""
    print(f"\n=== {description} ===")
    print(f"执行命令: {command}")
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    
    if result.stdout:
        print("输出:")
        print(result.stdout)
    
    if result.stderr:
        print("错误:")
        print(result.stderr)
    
    if result.returncode != 0:
        print(f"命令执行失败，退出码: {result.returncode}")
        return False
    
    return True

def check_database_exists():
    """检查数据库文件是否存在"""
    db_file = Path("test.db")
    if db_file.exists():
        print(f"数据库文件存在: {db_file}")
        print(f"文件大小: {db_file.stat().st_size} 字节")
        return True
    else:
        print("数据库文件不存在")
        return False

def init_database():
    """初始化数据库"""
    print("正在初始化数据库...")
    
    # 检查 alembic 是否安装
    if not run_command("alembic --version", "检查 Alembic 版本"):
        print("错误: Alembic 未安装，请运行: pip install alembic==1.13.1")
        return False
    
    # 应用迁移
    if run_command("alembic upgrade head", "应用数据库迁移"):
        print("数据库初始化成功！")
        return True
    else:
        print("数据库初始化失败！")
        return False

def reset_database():
    """重置数据库"""
    print("正在重置数据库...")
    
    # 删除数据库文件
    db_file = Path("test.db")
    if db_file.exists():
        db_file.unlink()
        print("已删除现有数据库文件")
    
    # 重新初始化
    return init_database()

def show_status():
    """显示数据库状态"""
    print("=== 数据库状态 ===")
    
    # 检查数据库文件
    check_database_exists()
    
    # 显示迁移状态
    run_command("alembic current", "当前迁移版本")
    run_command("alembic history --verbose", "迁移历史")

def create_migration(message):
    """创建新的迁移"""
    if not message:
        message = input("请输入迁移描述: ")
    
    command = f'alembic revision --autogenerate -m "{message}"'
    if run_command(command, f"创建迁移: {message}"):
        print("迁移文件创建成功！")
        print("请检查生成的迁移文件，然后运行 'alembic upgrade head' 应用迁移")

def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("数据库管理脚本")
        print("\n用法:")
        print("  python manage_db.py init      # 初始化数据库")
        print("  python manage_db.py reset     # 重置数据库")
        print("  python manage_db.py status    # 显示状态")
        print("  python manage_db.py migrate   # 创建新迁移")
        print("  python manage_db.py upgrade   # 应用迁移")
        return
    
    command = sys.argv[1]
    
    if command == "init":
        init_database()
    elif command == "reset":
        reset_database()
    elif command == "status":
        show_status()
    elif command == "migrate":
        message = sys.argv[2] if len(sys.argv) > 2 else ""
        create_migration(message)
    elif command == "upgrade":
        run_command("alembic upgrade head", "应用迁移")
    else:
        print(f"未知命令: {command}")
        print("可用命令: init, reset, status, migrate, upgrade")

if __name__ == "__main__":
    main() 