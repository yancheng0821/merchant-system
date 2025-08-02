#!/bin/bash

# AWS ECR配置
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="123456789012"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# 登录ECR
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

# 构建和推送前端
echo "构建前端应用..."
docker build -f docker/Dockerfile.merchant-admin -t merchant-admin .
docker tag merchant-admin:latest ${ECR_REGISTRY}/merchant-admin:latest
docker push ${ECR_REGISTRY}/merchant-admin:latest

# 构建后端服务
echo "构建Maven项目..."
cd merchant-server
mvn clean package -DskipTests
cd ..

# 构建和推送各个微服务
services=("auth-service" "merchant-service" "business-service" "analytics-service" "notification-service")

for service in "${services[@]}"; do
    echo "构建 ${service}..."
    docker build -f docker/Dockerfile.${service} -t ${service} .
    docker tag ${service}:latest ${ECR_REGISTRY}/${service}:latest
    docker push ${ECR_REGISTRY}/${service}:latest
done

# 构建和推送AI服务
echo "构建AI服务..."
docker build -f docker/Dockerfile.ai-service-python -t ai-service-python .
docker tag ai-service-python:latest ${ECR_REGISTRY}/ai-service-python:latest
docker push ${ECR_REGISTRY}/ai-service-python:latest

echo "所有镜像构建和推送完成！"