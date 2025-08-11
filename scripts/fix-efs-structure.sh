#!/bin/bash
# 修复EFS目录结构脚本

echo "🔧 修复EFS目录结构..."

# 通过auth-service清理嵌套目录
echo "📁 清理嵌套的avatars目录..."
kubectl exec deployment/auth-service -n merchant-system -- sh -c '
cd /usr/share/nginx/html/files
# 如果存在嵌套的avatars/avatars，移动文件到正确位置
if [ -d "avatars/avatars" ]; then
    echo "Found nested avatars/avatars, fixing..."
    for tenant in avatars/avatars/tenant_*; do
        if [ -d "$tenant" ]; then
            tenant_name=$(basename "$tenant")
            echo "Moving $tenant to avatars/$tenant_name"
            mkdir -p "avatars/$tenant_name"
            mv "$tenant"/* "avatars/$tenant_name/" 2>/dev/null || true
        fi
    done
    rm -rf avatars/avatars
fi

# 如果存在嵌套的avatars/room-icons，移动到正确位置
if [ -d "avatars/room-icons" ]; then
    echo "Found avatars/room-icons, moving to root..."
    mv avatars/room-icons room-icons 2>/dev/null || true
fi

# 确保room-icons目录存在
mkdir -p room-icons

# 列出最终结构
echo "Final structure:"
ls -la
ls -la avatars/ | head -5
ls -la room-icons/ | head -5
'

echo "✅ 目录结构修复完成"

# 重启file-service以确保看到最新的文件
echo "🔄 重启file-service..."
kubectl rollout restart deployment/file-service -n merchant-system
kubectl rollout status deployment/file-service -n merchant-system --timeout=60s

echo "✅ 修复完成！"