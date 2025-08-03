#!/bin/bash

# 更新AWS Load Balancer Controller IAM策略
echo "更新AWS Load Balancer Controller IAM策略..."

# 获取当前策略版本
POLICY_ARN="arn:aws:iam::168787218791:policy/AWSLoadBalancerControllerIAMPolicy"

# 列出所有策略版本
echo "列出当前策略版本..."
aws iam list-policy-versions --policy-arn $POLICY_ARN

# 获取非默认版本并删除（保留最多4个版本，为新版本留空间）
echo "删除旧的策略版本..."
VERSIONS_TO_DELETE=$(aws iam list-policy-versions --policy-arn $POLICY_ARN --query 'Versions[?IsDefaultVersion==`false`].VersionId' --output text)

for version in $VERSIONS_TO_DELETE; do
    echo "删除版本: $version"
    aws iam delete-policy-version --policy-arn $POLICY_ARN --version-id $version
done

# 创建新的策略版本
echo "创建新的策略版本..."
aws iam create-policy-version \
    --policy-arn $POLICY_ARN \
    --policy-document file://aws-load-balancer-controller/aws-load-balancer-controller-policy.json \
    --set-as-default

if [ $? -eq 0 ]; then
    echo "策略更新成功！"
    
    # 重启AWS Load Balancer Controller pods以应用新权限
    echo "重启AWS Load Balancer Controller..."
    kubectl rollout restart deployment/aws-load-balancer-controller -n kube-system
    
    # 等待重启完成
    kubectl rollout status deployment/aws-load-balancer-controller -n kube-system
    
    echo "等待30秒让控制器重新初始化..."
    sleep 30
    
    # 检查Ingress状态
    echo "检查Ingress状态..."
    kubectl get ingress -n merchant-system
    kubectl describe ingress merchant-ingress -n merchant-system
else
    echo "策略更新失败！"
    exit 1
fi