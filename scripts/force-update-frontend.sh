#!/bin/bash
# 强制更新前端并清除缓存

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

echo "========================================"
echo "  强制更新前端 - 确保使用最新版本"
echo "========================================"

# 1. 删除本地旧的镜像
log_step "删除本地旧镜像..."
docker rmi $(docker images | grep merchant-admin | awk '{print $3}') 2>/dev/null || true

# 2. 获取当前运行的Pod
log_step "获取当前Pod信息..."
OLD_POD=$(kubectl get pods -n merchant-system -l app=merchant-admin -o jsonpath='{.items[0].metadata.name}')
log_info "当前Pod: $OLD_POD"

# 3. 删除当前deployment（强制重新创建）
log_step "删除当前deployment..."
kubectl delete deployment merchant-admin -n merchant-system --wait=false

# 4. 等待Pod终止
log_info "等待旧Pod终止..."
kubectl wait --for=delete pod/$OLD_POD -n merchant-system --timeout=60s 2>/dev/null || true

# 5. 从ECR拉取最新镜像
log_step "从ECR拉取最新镜像..."
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.ca-central-1.amazonaws.com"
aws ecr get-login-password --region ca-central-1 | docker login --username AWS --password-stdin ${ECR_REGISTRY}
docker pull ${ECR_REGISTRY}/merchant-admin:latest

# 6. 重新创建deployment
log_step "重新创建deployment..."
kubectl apply -f k8s-deployment/merchant-admin.yaml

# 7. 立即设置为最新镜像
kubectl set image deployment/merchant-admin merchant-admin=${ECR_REGISTRY}/merchant-admin:latest -n merchant-system

# 8. 等待新Pod就绪
log_info "等待新Pod就绪..."
kubectl rollout status deployment/merchant-admin -n merchant-system --timeout=120s

# 9. 验证新部署
NEW_POD=$(kubectl get pods -n merchant-system -l app=merchant-admin -o jsonpath='{.items[0].metadata.name}')
log_success "新Pod已启动: $NEW_POD"

# 10. 验证API URL配置
log_step "验证API URL配置..."
kubectl exec deployment/merchant-admin -n merchant-system -- sh -c 'grep -o "https://api.swiftmerchantplatform.com" /usr/share/nginx/html/static/js/main.*.js | head -1'

if [ $? -eq 0 ]; then
    log_success "✓ 前端正在使用正确的API域名"
else
    log_error "✗ 前端未使用正确的API域名"
fi

echo ""
echo "========================================"
log_success "前端已强制更新！"
echo ""
echo "请执行以下操作："
echo "1. 清除浏览器缓存 (Ctrl+Shift+R 或 Cmd+Shift+R)"
echo "2. 或使用隐身/无痕模式访问"
echo "3. 访问: https://swiftmerchantplatform.com"
echo "========================================"