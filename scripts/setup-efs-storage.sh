#!/bin/bash

# EFS存储设置脚本
set -e

echo "🚀 开始设置EFS共享存储..."

# 检查kubectl是否可用
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl 未安装或不在PATH中"
    exit 1
fi

# 检查AWS CLI是否可用
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI 未安装或不在PATH中"
    exit 1
fi

# 获取当前集群名称
CLUSTER_NAME=$(kubectl config current-context)
echo "📋 当前集群: $CLUSTER_NAME"

# 1. 安装EFS CSI驱动
echo "📦 安装EFS CSI驱动..."
kubectl apply -k "github.com/kubernetes-sigs/aws-efs-csi-driver/deploy/kubernetes/overlays/stable/?ref=release-v1.7"

# 等待CSI驱动就绪
echo "⏳ 等待EFS CSI驱动就绪..."
kubectl wait --for=condition=ready pod -l app=efs-csi-node -n kube-system --timeout=300s

# 2. 获取EFS文件系统信息
echo "🔍 获取EFS文件系统信息..."
EFS_FILE_SYSTEM_ID=$(aws efs describe-file-systems --query 'FileSystems[?Name==`merchant-system-shared-storage`].FileSystemId' --output text)
EFS_AVATARS_ACCESS_POINT_ID=$(aws efs describe-access-points --query 'AccessPoints[?Name==`merchant-system-avatars-access-point`].AccessPointId' --output text)
EFS_UPLOADS_ACCESS_POINT_ID=$(aws efs describe-access-points --query 'AccessPoints[?Name==`merchant-system-uploads-access-point`].AccessPointId' --output text)

if [ -z "$EFS_FILE_SYSTEM_ID" ]; then
    echo "❌ 未找到EFS文件系统，请先运行 terraform apply"
    exit 1
fi

echo "📁 EFS文件系统ID: $EFS_FILE_SYSTEM_ID"
echo "👤 头像访问点ID: $EFS_AVATARS_ACCESS_POINT_ID"
echo "📤 上传访问点ID: $EFS_UPLOADS_ACCESS_POINT_ID"

# 3. 更新EFS CSI配置
echo "⚙️ 更新EFS CSI配置..."
sed -i.bak "s/fs-xxxxxxxxx/$EFS_FILE_SYSTEM_ID/g" k8s-deployment/efs-csi-driver.yaml
sed -i.bak "s/fsap-xxxxxxxxx/$EFS_AVATARS_ACCESS_POINT_ID/g" k8s-deployment/efs-csi-driver.yaml

# 更新uploads访问点ID（第二个fsap-xxxxxxxxx）
sed -i.bak "s/fsap-xxxxxxxxx/$EFS_UPLOADS_ACCESS_POINT_ID/g" k8s-deployment/efs-csi-driver.yaml

# 4. 应用EFS存储配置
echo "📋 应用EFS存储配置..."
kubectl apply -f k8s-deployment/efs-csi-driver.yaml

# 5. 等待PVC就绪
echo "⏳ 等待持久化卷声明就绪..."
kubectl wait --for=condition=bound pvc/avatars-pvc -n merchant-system --timeout=300s
kubectl wait --for=condition=bound pvc/uploads-pvc -n merchant-system --timeout=300s

# 6. 重启相关服务以使用新的存储
echo "🔄 重启服务以使用新的EFS存储..."
kubectl rollout restart deployment/auth-service -n merchant-system
kubectl rollout restart deployment/business-service -n merchant-system
kubectl rollout restart deployment/file-service -n merchant-system

# 7. 等待服务就绪
echo "⏳ 等待服务就绪..."
kubectl rollout status deployment/auth-service -n merchant-system --timeout=300s
kubectl rollout status deployment/business-service -n merchant-system --timeout=300s
kubectl rollout status deployment/file-service -n merchant-system --timeout=300s

echo "✅ EFS共享存储设置完成！"
echo ""
echo "📊 存储状态:"
kubectl get pv,pvc -n merchant-system
echo ""
echo "🔍 服务状态:"
kubectl get pods -n merchant-system -l app=auth-service
kubectl get pods -n merchant-system -l app=business-service
kubectl get pods -n merchant-system -l app=file-service 