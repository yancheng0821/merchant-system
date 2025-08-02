#!/bin/bash

# 设置kubectl上下文
kubectl config use-context your-eks-cluster

# 创建命名空间
kubectl apply -f k8s-deployment/namespace.yaml

# 应用配置
kubectl apply -f k8s-deployment/configmap.yaml
kubectl apply -f k8s-deployment/secrets.yaml

# 部署服务 (按依赖顺序)
echo "部署核心服务..."
kubectl apply -f k8s-deployment/auth-service.yaml
kubectl apply -f k8s-deployment/merchant-service.yaml

echo "等待核心服务启动..."
kubectl wait --for=condition=ready pod -l app=auth-service -n merchant-system --timeout=300s
kubectl wait --for=condition=ready pod -l app=merchant-service -n merchant-system --timeout=300s

echo "部署业务服务..."
kubectl apply -f k8s-deployment/business-service.yaml
kubectl apply -f k8s-deployment/analytics-service.yaml
kubectl apply -f k8s-deployment/notification-service.yaml

echo "部署AI服务..."
kubectl apply -f k8s-deployment/ai-service.yaml

echo "部署前端应用..."
kubectl apply -f k8s-deployment/merchant-admin.yaml

# 部署Ingress
kubectl apply -f k8s-deployment/ingress.yaml

# 检查部署状态
echo "检查部署状态..."
kubectl get pods -n merchant-system
kubectl get services -n merchant-system
kubectl get ingress -n merchant-system

echo "部署完成！"