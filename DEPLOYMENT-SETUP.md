# 🚀 商户管理系统 AWS 部署完整指南

## 📋 目录
- [架构概述](#架构概述)
- [前置要求](#前置要求)
- [部署步骤](#部署步骤)
- [配置说明](#配置说明)
- [共享存储配置](#共享存储配置)
- [监控和日志](#监控和日志)
- [故障排除](#故障排除)
- [安全配置](#安全配置)
- [成本优化](#成本优化)
- [团队协作](#团队协作)

## 🏗️ 架构概述

### 系统架构
```
AWS Cloud
├── Route 53 (DNS) → CloudFront (CDN) → ALB (Load Balancer)
│                           ↓
├── EKS Cluster
│   ├── Frontend (React) - merchant-admin
│   └── Backend Services
│       ├── auth-service (8081)
│       ├── merchant-service (8082)
│       ├── business-service (8083)
│       ├── notification-service (8084)
│       ├── analytics-service (8086)
│       ├── ai-service-python (5000)
│       └── file-service (80)
│                           ↓
└── AWS Services
    ├── RDS MySQL - 数据库
    ├── ElastiCache Redis - 缓存
    ├── EFS - 共享存储
    ├── ECR - 容器镜像仓库
    └── SQS/SNS/SES - 消息服务
```

### 核心特性
- ✅ **微服务架构** - 6个核心服务 + Python AI服务 + 前端
- ✅ **Kubernetes原生** - 使用K8s Ingress Controller和服务发现
- ✅ **EFS共享存储** - 持久化文件存储
- ✅ **高可用性** - 多可用区部署
- ✅ **自动扩展** - HPA和集群自动扩展

## 🔧 前置要求

### 必需工具
- AWS CLI (v2)
- kubectl
- terraform (v1.0+)
- docker

### AWS权限
确保AWS账户具有以下权限：
- EKS管理权限
- ECR管理权限
- RDS管理权限
- ElastiCache管理权限
- EFS管理权限
- IAM管理权限
- Route 53管理权限
- CloudFront管理权限

### 安装工具
```bash
# macOS
brew install terraform kubectl aws-cli

# Ubuntu/Debian
sudo apt-get install terraform kubectl awscli

# 配置AWS凭证
aws configure
```

## 🚀 部署步骤

### 1. 基础设施部署

```bash
# 进入terraform目录
cd terraform

# 初始化terraform
terraform init

# 查看执行计划
terraform plan -var="db_password=your-secure-password"

# 部署基础设施
terraform apply -var="db_password=your-secure-password"
```

### 2. 配置kubectl

```bash
# 获取集群配置
aws eks update-kubeconfig --region ca-central-1 --name merchant-system-eks

# 验证连接
kubectl get nodes
```

### 3. 配置敏感信息

```bash
# 复制模板文件
cp k8s-deployment/secrets-template.yaml k8s-deployment/secrets.yaml

# 编辑真实值
vim k8s-deployment/secrets.yaml
```

### 4. 部署EFS共享存储

```bash
# 设置EFS存储
./scripts/setup-efs-storage.sh

# 验证EFS存储
./scripts/verify-efs-storage.sh
```

### 5. 构建和推送镜像

```bash
# 修改脚本中的AWS账号ID
vim scripts/build-and-push.sh

# 执行构建和推送
chmod +x scripts/build-and-push.sh
./scripts/build-and-push.sh latest
```

### 6. 部署应用服务

```bash
# 创建命名空间
kubectl create namespace merchant-system

# 部署配置
kubectl apply -f k8s-deployment/configmap.yaml
kubectl apply -f k8s-deployment/secrets.yaml

# 部署服务
kubectl apply -f k8s-deployment/auth-service.yaml
kubectl apply -f k8s-deployment/merchant-service.yaml
kubectl apply -f k8s-deployment/business-service.yaml
kubectl apply -f k8s-deployment/analytics-service.yaml
kubectl apply -f k8s-deployment/notification-service.yaml
kubectl apply -f k8s-deployment/ai-service.yaml
kubectl apply -f k8s-deployment/file-service.yaml

# 部署前端
kubectl apply -f k8s-deployment/merchant-admin.yaml
```

### 7. 部署负载均衡器

```bash
# 部署AWS Load Balancer Controller
kubectl apply -f aws-load-balancer-controller/

# 部署Ingress
kubectl apply -f k8s-deployment/ingress.yaml
```

### 8. 部署监控和日志

```bash
# 部署Fluent Bit
kubectl apply -f k8s-deployment/fluent-bit.yaml

# 部署监控
kubectl apply -f k8s-deployment/monitoring.yaml
```

## ⚙️ 配置说明

### 需要修改的配置文件

1. **terraform/main.tf**
   - AWS账号ID
   - 区域设置
   - 实例规格

2. **k8s-deployment/configmap.yaml**
   - RDS端点
   - Redis端点
   - 域名配置
   - POS API配置

3. **k8s-deployment/secrets.yaml**
   - 数据库密码
   - JWT密钥
   - AWS访问密钥
   - POS API密钥

4. **k8s-deployment/ingress.yaml**
   - SSL证书ARN
   - 域名配置

### 服务端口映射
- auth-service: 8081
- merchant-service: 8082  
- business-service: 8083
- notification-service: 8084
- analytics-service: 8086
- ai-service-python: 5000 (FastAPI)
- merchant-admin: 80 (Nginx)

### 资源配置
- **CPU请求**: 250m-500m
- **内存请求**: 256Mi-512Mi
- **副本数**: 2-3个

## 📁 共享存储配置

### EFS文件系统
系统使用AWS EFS作为共享存储，支持以下功能：
- 头像文件存储 (`/shared/avatars`)
- 上传文件存储 (`/shared/uploads`)
- 多服务共享访问
- 持久化存储

### 存储架构
```
EFS文件系统 (fs-01d2e5718bb203727)
├── /avatars (fsap-006aa67db1635f20b)
│   └── auth-service 使用 (avatars-pvc)
└── /uploads (fsap-08997e3dd65b3eebd)
    ├── business-service 使用 (uploads-pvc)
    └── file-service 使用 (uploads-pvc)
```

### 服务映射
- `auth-service`: 使用 `avatars-pvc` 存储头像
- `business-service`: 使用 `uploads-pvc` 存储上传文件
- `file-service`: 使用 `uploads-pvc` 提供文件访问

### 验证存储
```bash
# 检查存储状态
kubectl get pv,pvc -n merchant-system

# 测试文件访问
./scripts/verify-efs-storage.sh
```

## 📊 监控和日志

### 推荐工具
- **Prometheus + Grafana** - 监控
- **ELK Stack** - 日志聚合
- **AWS CloudWatch** - AWS原生监控

### 健康检查
所有服务都配置了：
- Liveness Probe - 存活检查
- Readiness Probe - 就绪检查

### 查看日志
```bash
# 查看服务日志
kubectl logs -f deployment/auth-service -n merchant-system
kubectl logs -f deployment/business-service -n merchant-system

# 查看存储相关日志
kubectl logs -f deployment/file-service -n merchant-system

# 查看EFS CSI驱动日志
kubectl logs -f deployment/efs-csi-node -n kube-system
```

## 🔒 安全配置

### 网络安全
- VPC私有子网
- 安全组规则
- HTTPS强制重定向
- EFS网络隔离

### 应用安全
- JWT认证
- 敏感信息使用Secrets
- 镜像安全扫描
- 文件系统加密

### 敏感信息处理

#### 1. Terraform状态文件
```bash
# 不要提交状态文件
terraform/*.tfstate
terraform/*.tfstate.*
terraform/.terraform/
```

#### 2. Kubernetes Secrets
```bash
# 使用模板文件
cp k8s-deployment/secrets-template.yaml k8s-deployment/secrets.yaml

# 编辑真实值
vim k8s-deployment/secrets.yaml
```

#### 3. 环境变量
```bash
# 不要提交环境文件
.env
.env.local
.env.production
```

## 💰 成本优化

### 建议配置
- **EKS节点**: t3.medium (按需)
- **RDS**: db.t3.micro
- **Redis**: cache.t3.micro
- **EFS**: 按使用量付费
- **副本数**: 最小2个

### 预估月成本
- EKS集群: ~$70
- 节点实例: ~$60
- RDS: ~$15
- Redis: ~$15
- EFS: ~$10
- **总计**: ~$170/月

### 扩容策略

#### 水平扩容
```bash
kubectl scale deployment business-service --replicas=5 -n merchant-system
```

#### 自动扩容
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: business-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: business-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## 🚨 故障排除

### 常见问题

1. **EFS挂载失败**
   ```bash
   # 检查EFS CSI驱动状态
   kubectl get pods -n kube-system -l app=efs-csi-node
   
   # 检查安全组配置
   aws ec2 describe-security-groups --group-ids <security-group-id>
   ```

2. **存储权限问题**
   ```bash
   # 检查访问点配置
   aws efs describe-access-points --access-point-id <access-point-id>
   
   # 检查文件系统状态
   aws efs describe-file-systems --file-system-id <file-system-id>
   ```

3. **服务无法访问存储**
   ```bash
   # 检查PVC状态
   kubectl describe pvc avatars-pvc -n merchant-system
   kubectl describe pvc uploads-pvc -n merchant-system
   
   # 检查Pod卷挂载
   kubectl describe pod <pod-name> -n merchant-system
   ```

4. **Pod启动失败**
   ```bash
   kubectl describe pod <pod-name> -n merchant-system
   kubectl logs <pod-name> -n merchant-system
   ```

5. **服务无法访问**
   ```bash
   kubectl get svc -n merchant-system
   kubectl get ingress -n merchant-system
   ```

### 重置存储
```bash
# 删除PVC（会删除数据）
kubectl delete pvc avatars-pvc uploads-pvc -n merchant-system

# 重新创建
kubectl apply -f k8s-deployment/efs-csi-driver.yaml
```

## 👥 团队协作

### 新成员加入时
1. 复制 `secrets-template.yaml` 为 `secrets.yaml`
2. 配置真实的敏感信息
3. 运行 `terraform init` 初始化基础设施
4. 运行部署脚本

### 环境变量管理
- 开发环境: 使用 `.env.local`
- 生产环境: 使用K8s ConfigMap和Secrets
- 不要提交任何包含真实密码的文件

### 安全检查清单
- [ ] 确认 `terraform.tfstate` 文件已添加到 `.gitignore`
- [ ] 确认 `secrets.yaml` 文件已添加到 `.gitignore`
- [ ] 确认所有敏感信息都已正确配置
- [ ] 确认Terraform状态文件已安全备份
- [ ] 确认AWS凭证已正确配置

## 🔄 CI/CD集成

### GitHub Actions示例
```yaml
name: Deploy to EKS
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ca-central-1
    - name: Build and push
      run: ./scripts/build-and-push.sh
    - name: Deploy
      run: ./scripts/deploy.sh
```

## 🌐 域名配置

### DNS记录
```
yourdomain.com -> ALB
api.yourdomain.com -> ALB
```

### SSL证书
在AWS Certificate Manager中申请证书：
- yourdomain.com
- *.yourdomain.com

## 🧹 清理资源

```bash
# 删除应用
kubectl delete namespace merchant-system

# 删除基础设施
cd terraform
terraform destroy
```

## 📞 支持

如有问题，请检查：
1. AWS服务限制
2. K8s资源配额
3. 网络连通性
4. 权限配置
5. EFS CSI驱动状态
6. 存储卷绑定状态

## 📚 相关文档

- [项目README](README.md)
- [Terraform配置说明](terraform/README.md)
- [Kubernetes配置说明](k8s-deployment/README.md)
- [EFS存储配置](k8s-deployment/EFS-STORAGE-README.md) 