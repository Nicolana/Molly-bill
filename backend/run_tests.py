#!/usr/bin/env python3
"""
测试运行脚本
"""
import subprocess
import sys
import os

def run_tests():
    """运行所有测试"""
    print("🧪 开始运行测试...")
    
    # 运行测试
    result = subprocess.run([
        sys.executable, "-m", "pytest", 
        "tests/", 
        "-v", 
        "--tb=short",
        "--color=yes"
    ], cwd=os.path.dirname(os.path.abspath(__file__)))
    
    if result.returncode == 0:
        print("✅ 所有测试通过！")
    else:
        print("❌ 测试失败！")
        sys.exit(1)

def run_specific_test(test_file):
    """运行特定测试文件"""
    print(f"🧪 运行测试文件: {test_file}")
    
    result = subprocess.run([
        sys.executable, "-m", "pytest", 
        f"tests/{test_file}", 
        "-v", 
        "--tb=short",
        "--color=yes"
    ], cwd=os.path.dirname(os.path.abspath(__file__)))
    
    if result.returncode == 0:
        print("✅ 测试通过！")
    else:
        print("❌ 测试失败！")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # 运行特定测试文件
        test_file = sys.argv[1]
        run_specific_test(test_file)
    else:
        # 运行所有测试
        run_tests() 