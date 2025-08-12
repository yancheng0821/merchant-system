# Merchant System 部署脚本

## 📁 核心脚本

### 🚀 rapid-deploy.sh - 主要部署脚本
一站式部署解决方案，支持灵活选择要部署的服务。

**使用方法：**
```bash
./rapid-deploy.sh
```

**部署选项：**
1. 全部服务 (前端 + 后端 + AI)
2. 仅前端 (merchant-admin)
3. 前端 + 业务服务 (最常用)
4. 前端 + Auth + 业务服务
5. 仅业务服务
6. 仅后端 (所有Java服务)
7. 仅AI服务
8. Auth + 文件服务
9. 自定义选择

**特性：**
- 交互式服务选择
- 并行构建镜像
- 自动版本管理
- 健康检查
- 部署耗时统计

### 🔧 辅助脚本

#### fix-efs-structure.sh
修复EFS目录结构，解决文件上传路径嵌套问题。

```bash
./fix-efs-structure.sh
```

#### force-update-frontend.sh
强制更新前端并清除CDN缓存。

```bash
./force-update-frontend.sh
```

#### setup-efs-storage.sh
初始配置AWS EFS共享存储（仅首次需要）。

```bash
./setup-efs-storage.sh
```

#### verify-efs-storage.sh
验证EFS存储配置状态。

```bash
./verify-efs-storage.sh
```

#### verify-timezone.sh
验证所有Pod的时区设置。

```bash
./verify-timezone.sh
```

## 📝 快速开始

### 首次部署
```bash
# 1. 设置EFS存储（仅首次）
./setup-efs-storage.sh

# 2. 验证存储
./verify-efs-storage.sh

# 3. 部署所有服务
./rapid-deploy.sh
# 选择 1
```

### 日常部署

#### 最常用：前端 + 业务服务
```bash
./rapid-deploy.sh
# 选择 3
```

#### 仅更新前端
```bash
./rapid-deploy.sh
# 选择 2
```

#### 仅更新业务服务
```bash
./rapid-deploy.sh
# 选择 5
```

## 🔍 常用命令

### 查看状态
```bash
# Pod状态
kubectl get pods -n merchant-system

# 查看日志
kubectl logs -n merchant-system deployment/business-service -f

# 查看事件
kubectl get events -n merchant-system --sort-by='.lastTimestamp'
```

### 故障排查
```bash
# Pod详情
kubectl describe pod <pod-name> -n merchant-system

# 进入Pod调试
kubectl exec -it <pod-name> -n merchant-system -- /bin/sh

# 重启服务
kubectl rollout restart deployment/business-service -n merchant-system
```

## 🌐 访问地址

- **前端**: https://swiftmindsystems.com
- **API**: https://api.swiftmindsystems.com
- **健康检查**: https://api.swiftmindsystems.com/health

## ⚙️ 环境要求

### 必需工具
- kubectl
- docker
- aws cli
- mvn
- npm

### 配置要求
- AWS凭证配置
- kubectl上下文配置
- ECR访问权限

## 🔐 Stripe Connect配置

### 应用Stripe配置
```bash
kubectl apply -f k8s-deployment/stripe-config.yaml
```

### 配置Webhook
在Stripe Dashboard配置webhook端点：
- URL: `https://api.swiftmindsystems.com/api/stripe-connect/webhook`
- 事件: payment_intent.succeeded, account.updated等

## 💡 注意事项

1. **版本管理**: 自动生成时间戳版本号
2. **并行构建**: 多镜像并行构建提升效率
3. **增量部署**: 支持单服务部署
4. **时区设置**: 所有服务使用America/Vancouver时区
5. **EFS存储**: 用于文件共享，首次需配置

## 📞 支持

部署问题检查清单：
1. AWS凭证是否有效
2. kubectl上下文是否正确
3. 必需工具是否已安装
4. 网络连接是否正常
5. ECR仓库访问权限