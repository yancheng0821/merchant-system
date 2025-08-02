# 🚀 AWS K8s部署检查清单

## ✅ 部署前准备

### 1. 基础设施准备
- [ ] AWS账号配置完成
- [ ] AWS CLI安装并配置
- [ ] kubectl安装完成
- [ ] terraform安装完成
- [ ] Docker安装完成

### 2. 配置文件修改

#### terraform/main.tf
- [ ] 修改AWS账号ID: `123456789012` → 你的账号ID
- [ ] 确认AWS区域: `us-east-1`
- [ ] 调整实例规格（可选）

#### k8s-deployment/configmap.yaml
- [ ] 修改RDS端点: `merchant-mysql.cxxx.us-east-1.rds.amazonaws.com`
- [ ] 修改Redis端点: `merchant-redis.xxx.cache.amazonaws.com`
- [ ] 修改RabbitMQ端点: `merchant-rabbitmq.xxx.mq.us-east-1.amazonaws.com`
- [ ] 修改域名: `yourdomain.com` → 你的域名
- [ ] 修改POS API配置（如果使用）

#### k8s-deployment/secrets.yaml
- [ ] 修改数据库用户名/密码（Base64编码）
- [ ] 修改JWT密钥（Base64编码）
- [ ] 修改AWS访问密钥（Base64编码）
- [ ] 修改RabbitMQ凭证（Base64编码）
- [ ] 修改POS API密钥（Base64编码）

#### k8s-deployment/ingress.yaml
- [ ] 修改SSL证书ARN
- [ ] 修改域名配置

#### scripts/build-and-push.sh
- [ ] 修改AWS账号ID和ECR仓库地址

## 🏗️ 部署步骤

### 1. 基础设施部署
```bash
cd terraform
terraform init
terraform plan -var="db_password=your-secure-password"
terraform apply -var="db_password=your-secure-password"
```

### 2. 配置kubectl
```bash
aws eks update-kubeconfig --region us-east-1 --name merchant-system-eks
kubectl get nodes
```

### 3. 构建和推送镜像
```bash
chmod +x scripts/build-and-push.sh
./scripts/build-and-push.sh
```

### 4. 部署应用
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## 🔍 部署验证

### 1. 检查Pod状态
```bash
kubectl get pods -n merchant-system
```
所有Pod应该显示 `Running` 状态

### 2. 检查服务状态
```bash
kubectl get services -n merchant-system
```

### 3. 检查Ingress状态
```bash
kubectl get ingress -n merchant-system
```

### 4. 检查应用健康状态
```bash
# 检查各服务健康检查端点
kubectl port-forward svc/auth-service 8081:8081 -n merchant-system
curl http://localhost:8081/actuator/health

kubectl port-forward svc/ai-service 5000:5000 -n merchant-system
curl http://localhost:5000/health
```

## 🐛 故障排查

### Pod启动失败
```bash
kubectl describe pod <pod-name> -n merchant-system
kubectl logs <pod-name> -n merchant-system
```

### 服务无法访问
```bash
kubectl get endpoints -n merchant-system
kubectl describe service <service-name> -n merchant-system
```

### Ingress问题
```bash
kubectl describe ingress merchant-ingress -n merchant-system
```

## 📊 监控和维护

### 查看资源使用情况
```bash
kubectl top pods -n merchant-system
kubectl top nodes
```

### 扩容服务
```bash
kubectl scale deployment business-service --replicas=5 -n merchant-system
```

### 滚动更新
```bash
kubectl set image deployment/business-service business-service=your-ecr-repo/business-service:v2 -n merchant-system
```

## 🔧 配置说明

### 环境变量映射
- **SPRING_PROFILES_ACTIVE=prod** - 直接使用生产配置
- **DB_HOST/DB_USERNAME/DB_PASSWORD** - 数据库连接
- **RABBITMQ_HOST/RABBITMQ_USERNAME/RABBITMQ_PASSWORD** - 消息队列
- **AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY** - AWS服务访问
- **POS_API_URL/POS_API_KEY** - POS支付接口

### 服务发现
- 使用K8s原生服务发现，无需Eureka
- 服务间通信通过K8s Service名称
- 例如：`http://auth-service:8081`

### 负载均衡
- ALB Ingress Controller处理外部流量
- K8s Service处理内部负载均衡
- 支持会话亲和性和健康检查

## 🚨 安全注意事项

- [ ] 所有敏感信息使用K8s Secrets存储
- [ ] 启用HTTPS和SSL证书
- [ ] 配置网络策略限制Pod间通信
- [ ] 定期更新镜像和依赖
- [ ] 启用Pod安全策略
- [ ] 配置RBAC权限控制

## 💰 成本优化建议

- [ ] 使用Spot实例降低成本
- [ ] 配置HPA自动扩缩容
- [ ] 监控资源使用率，调整requests/limits
- [ ] 使用Reserved Instances for RDS
- [ ] 定期清理未使用的资源