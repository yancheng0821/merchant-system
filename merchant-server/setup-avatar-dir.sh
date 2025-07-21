#!/bin/bash

# 头像目录设置脚本
# 用于创建头像存储目录

echo "=== 设置头像存储目录 ==="

# 统一路径
AVATAR_PATH="/opt/merchant-system/avatars"

echo "设置头像存储路径: $AVATAR_PATH"

# 创建目录
echo "创建头像存储目录..."
sudo mkdir -p $AVATAR_PATH

# 设置权限
echo "设置目录权限..."
# macOS使用staff组，Linux使用$USER组
if [[ "$OSTYPE" == "darwin"* ]]; then
    sudo chown -R $USER:staff $AVATAR_PATH
else
    sudo chown -R $USER:$USER $AVATAR_PATH
fi
sudo chmod -R 755 $AVATAR_PATH

# 验证
if [ -d "$AVATAR_PATH" ]; then
    echo "✅ 头像目录创建成功: $AVATAR_PATH"
    echo "目录权限:"
    ls -la $AVATAR_PATH
else
    echo "❌ 头像目录创建失败"
    exit 1
fi

echo "=== 设置完成 ===" 