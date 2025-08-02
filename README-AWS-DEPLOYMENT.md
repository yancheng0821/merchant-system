# AWS K8s部署完整方案

## 🏗️ 架构概述

### 简化后的架构
- ❌ **移除Gateway Service** - 使用K8s Ingress Controller
- ❌ **移除Eureka Server** - 使用K8s原生服务发现
- ✅ **保留核心微服务** - 6个核心服务 + Python AI服务 + 前端
- ✅ **直接使用application-prod.yml** - 无需额外K8s配置文件

### AWS基础设施
- **EKS** - Kubernetes集群
- **RDS MySQL** - 数据库
- **ElastiCache Redis** - 缓存
- **ECR** - 容器镜像仓库
- **ALB** - 应用负载均衡器
- **Route 53** - DNS解析
- **CloudFront** - CDN加速

## 🚀 部署步骤

### 1. 准备工作

```bash
# 安装必要工具
brew install terraform kubectl aws-cli

# 配置AWS凭证
aws configure

# 克隆项目
git clone your-repo-url
cd merchant-system
```

### 2. 基础设施部署

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

### 3. 配置kubectl

```bash
# 配置kubectl连接EKS
aws eks update-kubeconfig --region us-east-1 --name merchant-system-eks

# 验证连接
kubectl get nodes
```

### 4. 构建和推送镜像

```bash
# 修改脚本中的AWS账号ID
vim scripts/build-and-push.sh

# 执行构建和推送
chmod +x scripts/build-and-push.sh
./scripts/build-and-push.sh
```

### 5. 部署应用

```bash
# 修改配置文件中的实际值
vim k8s-deployment/configmap.yaml
vim k8s-deployment/secrets.yaml

# 部署应用
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## 📋 配置清单

### 需要修改的配置

1. **terraform/main.tf**
   - AWS账号ID
   - 区域设置
   - 实例规格

2. **k8s-deployment/configmap.yaml**
   - RDS端点
   - Redis端点
   - RabbitMQ端点
   - 域名配置
   - POS API配置

3. **k8s-deployment/secrets.yaml**
   - 数据库密码
   - JWT密钥
   - AWS访问密钥
   - RabbitMQ凭证
   - POS API密钥

4. **k8s-deployment/ingress.yaml**
   - SSL证书ARN
   - 域名配置

5. **各服务的application-prod.yml**
   - 已配置好，直接使用环境变量

## 🔧 服务配置

### 微服务端口映射
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

## 📊 监控和日志

### 推荐工具
- **Prometheus + Grafana** - 监控
- **ELK Stack** - 日志聚合
- **AWS CloudWatch** - AWS原生监控

### 健康检查
所有服务都配置了：
- Liveness Probe - 存活检查
- Readiness Probe - 就绪检查

## 🔒 安全配置

### 网络安全
- VPC私有子网
- 安全组规则
- HTTPS强制重定向

### 应用安全
- JWT认证
- 敏感信息使用Secrets
- 镜像安全扫描

## 💰 成本优化

### 建议配置
- **EKS节点**: t3.medium (按需)
- **RDS**: db.t3.micro
- **Redis**: cache.t3.micro
- **副本数**: 最小2个

### 预估月成本
- EKS集群: ~$70
- 节点实例: ~$60
- RDS: ~$15
- Redis: ~$15
- **总计**: ~$160/月

## 🚨 故障排查

### 常见问题

1. **Pod启动失败**
```bash
kubectl describe pod <pod-name> -n merchant-system
kubectl logs <pod-name> -n merchant-system
```

2. **服务无法访问**
```bash
kubectl get svc -n merchant-system
kubectl get ingress -n merchant-system
```

3. **数据库连接失败**
```bash
# 检查安全组规则
# 验证数据库端点
```

## 📈 扩容策略

### 水平扩容
```bash
kubectl scale deployment business-service --replicas=5 -n merchant-system
```

### 自动扩容
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
        aws-region: us-east-1
    - name: Build and push
      run: ./scripts/build-and-push.sh
    - name: Deploy
      run: ./scripts/deploy.sh
```

## 📞 支持

如有问题，请检查：
1. AWS服务限制
2. K8s资源配额
3. 网络连通性
4. 权限配置