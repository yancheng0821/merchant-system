#!/bin/bash

# AI 服务启动脚本

echo "=== AI 微服务启动脚本 ==="

# 检查 Python 环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装，请先安装 Python3"
    exit 1
fi

# 检查依赖
if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt 文件不存在"
    exit 1
fi

# 创建虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    echo "🔧 创建虚拟环境..."
    python3 -m venv venv
    
    # 激活虚拟环境
    echo "🔧 激活虚拟环境..."
    source venv/bin/activate
    
    # 首次安装依赖
    echo "📦 首次安装依赖..."
    pip install -r requirements.txt
    
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
else
    # 激活虚拟环境
    echo "🔧 激活虚拟环境..."
    source venv/bin/activate
    
    # 检查是否需要更新依赖（比较 requirements.txt 和已安装的包）
    if [ requirements.txt -nt venv/pyvenv.cfg ]; then
        echo "📦 检测到依赖更新，重新安装..."
        pip install -r requirements.txt
        
        if [ $? -ne 0 ]; then
            echo "❌ 依赖更新失败"
            exit 1
        fi
    else
        echo "✅ 依赖已是最新，跳过安装"
    fi
fi

# 设置环境变量
export PORT=${PORT:-5001}

echo "🚀 启动 AI 服务..."
echo "   端口: $PORT"
echo "   访问地址: http://localhost:$PORT"
echo "   API 文档: http://localhost:$PORT/docs"
echo ""

# 启动服务
python3 main.py