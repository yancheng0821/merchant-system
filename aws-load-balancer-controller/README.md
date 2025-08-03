# AWS Load Balancer Controller 配置文件

这个目录包含了AWS Load Balancer Controller的相关配置文件。

## 文件说明

### `aws-load-balancer-controller-policy.json`
AWS Load Balancer Controller所需的IAM权限策略。包含：
- EC2权限（VPC、子网、安全组等）
- ELB权限（负载均衡器管理）
- ACM权限（证书管理）
- WAF权限（Web应用防火墙）

### `aws-load-balancer-controller-service-account.yaml`
Kubernetes ServiceAccount配置，用于IRSA (IAM Roles for Service Accounts)。

### `trust-policy.json`
IAM Role的信任策略，允许EKS ServiceAccount假设该角色。

### `update-alb-policy.sh`
自动化更新IAM策略的脚本。包含：
- 删除旧策略版本
- 创建新策略版本
- 重启Load Balancer Controller

## 使用说明

### 初次部署
1. 创建IAM策略：
```bash
aws iam create-policy \
    --policy-name AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://aws-load-balancer-controller-policy.json
```

2. 创建IAM角色：
```bash
aws iam create-role \
    --role-name AmazonEKSLoadBalancerControllerRole \
    --assume-role-policy-document file://trust-policy.json
```

3. 附加策略到角色：
```bash
aws iam attach-role-policy \
    --policy-arn arn:aws:iam::168787218791:policy/AWSLoadBalancerControllerIAMPolicy \
    --role-name AmazonEKSLoadBalancerControllerRole
```

4. 创建ServiceAccount：
```bash
kubectl apply -f aws-load-balancer-controller-service-account.yaml
```

### 更新权限
如果需要更新权限，可以使用脚本：
```bash
./update-alb-policy.sh
```

## 注意事项
- IAM策略最多只能有5个版本
- 更新策略后需要重启Load Balancer Controller
- 确保OIDC提供者ID正确匹配你的EKS集群