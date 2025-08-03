#!/bin/bash
set -e  # 出错立即退出



# ==============================
# AWS ECR 配置
# ==============================
AWS_REGION="ca-central-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
IMAGE_TAG=${1:-latest}  # 可选参数，不传则使用 latest
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "当前 AWS Account ID: ${AWS_ACCOUNT_ID}"
echo "目标 ECR: ${ECR_REGISTRY}"
echo "镜像标签: ${IMAGE_TAG}"

# 登录 ECR
echo "=== 登录 ECR ==="
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

# ==============================
# 构建并推送前端
# ==============================
echo "=== 构建并推送前端 merchant-admin:${IMAGE_TAG} ==="
docker build -f docker/Dockerfile.merchant-admin -t merchant-admin:${IMAGE_TAG} .
docker tag merchant-admin:${IMAGE_TAG} ${ECR_REGISTRY}/merchant-admin:${IMAGE_TAG}
docker push ${ECR_REGISTRY}/merchant-admin:${IMAGE_TAG}

# ==============================
# 构建后端 Maven 项目
# ==============================
echo "=== 构建 Maven 项目 ==="
cd merchant-server
mvn clean package -DskipTests
cd ..

# ==============================
# 构建并推送后端微服务
# ==============================
services=("auth-service" "merchant-service" "business-service" "analytics-service" "notification-service")

for service in "${services[@]}"; do
    echo "=== 构建并推送 ${service}:${IMAGE_TAG} ==="
    docker build -f docker/Dockerfile.${service} -t ${service}:${IMAGE_TAG} .
    docker tag ${service}:${IMAGE_TAG} ${ECR_REGISTRY}/${service}:${IMAGE_TAG}
    docker push ${ECR_REGISTRY}/${service}:${IMAGE_TAG}
done

# ==============================
# 构建并推送 AI 服务
# ==============================
echo "=== 构建并推送 AI 服务 ai-service-python:${IMAGE_TAG} ==="
docker build -f docker/Dockerfile.ai-service-python -t ai-service-python:${IMAGE_TAG} .
docker tag ai-service-python:${IMAGE_TAG} ${ECR_REGISTRY}/ai-service-python:${IMAGE_TAG}
docker push ${ECR_REGISTRY}/ai-service-python:${IMAGE_TAG}

echo "✅ 所有镜像 ${IMAGE_TAG} 构建和推送完成！"
