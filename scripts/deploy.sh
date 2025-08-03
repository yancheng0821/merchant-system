#!/bin/bash

# 设置kubectl上下文
kubectl config use-context arn:aws:eks:ca-central-1:168787218791:cluster/merchant-system-eks

# 创建命名空间
kubectl apply -f k8s-deployment/namespace.yaml

# 应用配置
kubectl apply -f k8s-deployment/configmap.yaml
kubectl apply -f k8s-deployment/secrets.yaml

# 强制重新部署所有服务
echo "强制重新部署所有服务..."

# 核心服务
echo "重新部署核心服务..."
kubectl rollout restart deployment/auth-service -n merchant-system
kubectl rollout restart deployment/merchant-service -n merchant-system

echo "等待核心服务启动..."
kubectl wait --for=condition=ready pod -l app=auth-service -n merchant-system --timeout=300s
kubectl wait --for=condition=ready pod -l app=merchant-service -n merchant-system --timeout=300s

# 业务服务
echo "重新部署业务服务..."
kubectl rollout restart deployment/business-service -n merchant-system
kubectl rollout restart deployment/analytics-service -n merchant-system
kubectl rollout restart deployment/notification-service -n merchant-system

# AI服务
echo "重新部署AI服务..."
kubectl rollout restart deployment/ai-service-python -n merchant-system

# 前端应用
echo "重新部署前端应用..."
kubectl rollout restart deployment/merchant-admin -n merchant-system

# 等待所有服务启动
echo "等待所有服务启动..."
kubectl wait --for=condition=ready pod -l app=business-service -n merchant-system --timeout=300s
kubectl wait --for=condition=ready pod -l app=analytics-service -n merchant-system --timeout=300s
kubectl wait --for=condition=ready pod -l app=notification-service -n merchant-system --timeout=300s
kubectl wait --for=condition=ready pod -l app=ai-service-python -n merchant-system --timeout=300s
kubectl wait --for=condition=ready pod -l app=merchant-admin -n merchant-system --timeout=300s

# 检查部署状态
echo "检查部署状态..."
kubectl get pods -n merchant-system
kubectl get services -n merchant-system
kubectl get ingress -n merchant-system

echo "部署完成！"