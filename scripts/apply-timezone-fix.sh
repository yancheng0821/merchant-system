#!/bin/bash

# 应用时区修复的Kubernetes配置更新脚本

echo "========================================="
echo "Applying Timezone Fix for Services"
echo "========================================="
echo ""

# 应用更新的deployment配置
echo "1. Applying analytics-service deployment..."
kubectl apply -f k8s-deployment/analytics-service.yaml

echo ""
echo "2. Applying merchant-admin deployment..."
kubectl apply -f k8s-deployment/merchant-admin.yaml

echo ""
echo "3. Applying notification-service deployment..."
kubectl apply -f k8s-deployment/notification-service.yaml

echo ""
echo "========================================="
echo "Rollout restart to apply changes..."
echo "========================================="
echo ""

# 重启相关的deployments以应用新的环境变量
echo "Restarting analytics-service..."
kubectl rollout restart deployment analytics-service -n merchant-system
kubectl rollout status deployment analytics-service -n merchant-system --timeout=120s

echo ""
echo "Restarting merchant-admin..."
kubectl rollout restart deployment merchant-admin -n merchant-system
kubectl rollout status deployment merchant-admin -n merchant-system --timeout=120s

echo ""
echo "Restarting notification-service..."
kubectl rollout restart deployment notification-service -n merchant-system
kubectl rollout status deployment notification-service -n merchant-system --timeout=120s

echo ""
echo "========================================="
echo "Verification"
echo "========================================="
echo ""

# 等待几秒让pods完全启动
echo "Waiting for pods to be ready..."
sleep 10

# 验证时区设置
echo "Verifying timezone settings..."
echo ""

# 获取新的pod名称并检查时区
for deployment in analytics-service merchant-admin notification-service; do
    echo "Checking $deployment:"
    POD_NAME=$(kubectl get pods -n merchant-system -l app=$deployment -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -n "$POD_NAME" ]; then
        TZ_VALUE=$(kubectl exec -n merchant-system $POD_NAME -- printenv TZ 2>/dev/null || echo "Not set")
        SYSTEM_TIME=$(kubectl exec -n merchant-system $POD_NAME -- date 2>/dev/null || echo "Unable to get time")
        
        echo "  Pod: $POD_NAME"
        echo "  TZ Variable: $TZ_VALUE"
        echo "  System Time: $SYSTEM_TIME"
        
        # 验证时区是否正确设置
        if [[ "$TZ_VALUE" == "America/Vancouver" ]]; then
            echo "  ✅ Timezone correctly set to Vancouver"
        else
            echo "  ⚠️ Timezone not set correctly"
        fi
    else
        echo "  ⚠️ No running pod found for $deployment"
    fi
    echo ""
done

echo "========================================="
echo "Summary"
echo "========================================="
echo ""

# 显示所有pods的状态
echo "Current pod status:"
kubectl get pods -n merchant-system | grep -E "analytics-service|merchant-admin|notification-service"

echo ""
echo "Timezone fix application completed!"
echo ""
echo "If any services still show incorrect timezone, you may need to:"
echo "1. Check if the Docker images need to be rebuilt with timezone support"
echo "2. Run the build-with-timezone.sh script to rebuild images"
echo "3. Update the deployment files with new image tags"
echo ""