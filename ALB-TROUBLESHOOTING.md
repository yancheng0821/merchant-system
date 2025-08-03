# AWS Load Balancer Controller 问题解决方案

## 问题描述
AWS Load Balancer Controller无法创建ALB，Ingress没有ADDRESS，错误信息显示权限不足。

## 根本原因
AWS Load Balancer Controller的IAM策略缺少必要的权限，特别是：
- `ec2:DescribeRouteTables`
- `ec2:DescribeAvailabilityZones`
- `ec2:CreateSecurityGroup`
- `ec2:CreateTags`
- `elasticloadbalancing:*` 相关权限

## 解决步骤

### 1. 更新IAM策略
更新了 `aws-load-balancer-controller-policy.json` 文件，添加了缺失的权限。

### 2. 删除旧策略版本
由于AWS IAM策略最多只能有5个版本，需要先删除旧版本：
```bash
aws iam delete-policy-version --policy-arn arn:aws:iam::168787218791:policy/AWSLoadBalancerControllerIAMPolicy --version-id v1
aws iam delete-policy-version --policy-arn arn:aws:iam::168787218791:policy/AWSLoadBalancerControllerIAMPolicy --version-id v2
aws iam delete-policy-version --policy-arn arn:aws:iam::168787218791:policy/AWSLoadBalancerControllerIAMPolicy --version-id v3
```

### 3. 创建新策略版本
```bash
aws iam create-policy-version \
    --policy-arn arn:aws:iam::168787218791:policy/AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://aws-load-balancer-controller-policy.json \
    --set-as-default
```

### 4. 重启Load Balancer Controller
```bash
kubectl rollout restart deployment/aws-load-balancer-controller -n kube-system
kubectl rollout status deployment/aws-load-balancer-controller -n kube-system
```

## 验证结果

### 1. Ingress状态
```bash
kubectl get ingress -n merchant-system
```
输出显示：
```
NAME               CLASS    HOSTS                                           ADDRESS                                                                   PORTS   AGE
merchant-ingress   <none>   swiftmindsystems.com,api.swiftmindsystems.com   k8s-merchant-merchant-7912ad3b0b-1436748990.ca-central-1.elb.amazonaws.com   80      131m
```

### 2. ALB状态
```bash
aws elbv2 describe-load-balancers --query 'LoadBalancers[?contains(LoadBalancerName, `k8s-merchant`)]'
```
ALB状态为 "active"

### 3. 功能测试
```bash
curl -I http://k8s-merchant-merchant-7912ad3b0b-1436748990.ca-central-1.elb.amazonaws.com
```
返回301重定向到HTTPS，证明ALB正常工作。

## 关键配置

### 更新后的IAM策略包含：
- 完整的EC2权限（包括DescribeRouteTables, DescribeAvailabilityZones等）
- 完整的ELB权限（elasticloadbalancing:*）
- 安全组创建和标签管理权限
- 条件权限控制，确保只能操作特定集群的资源

### Ingress配置：
- SSL重定向：HTTP自动跳转到HTTPS
- 证书配置：使用ACM证书
- 目标类型：IP模式
- 方案：internet-facing

## 总结
问题已完全解决，ALB成功创建并正常工作。主要是IAM权限配置不完整导致的问题。