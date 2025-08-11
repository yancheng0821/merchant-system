# Merchant System 部署脚本

## 📁 脚本说明

### 🚀 rapid-deploy.sh - 快速部署脚本
主要的部署脚本，支持灵活选择要部署的服务，包括：
- 全部服务部署
- 仅前端部署
- 仅后端部署
- 仅AI服务部署
- 单个服务部署
- 自定义服务组合部署

**使用方法：**
```bash
# 赋予执行权限
chmod +x rapid-deploy.sh

# 运行部署
./rapid-deploy.sh
```

**特性：**
- 交互式服务选择
- 并行构建镜像，提高效率
- 自动版本管理
- 健康检查
- 部署耗时统计
- 可选的本地镜像清理

### 📦 setup-efs-storage.sh - EFS存储设置脚本
配置AWS EFS共享存储，用于多Pod间共享文件（如用户头像、上传文件等）。

**使用方法：**
```bash
chmod +x setup-efs-storage.sh
./setup-efs-storage.sh
```

**功能：**
- 安装EFS CSI驱动
- 配置EFS文件系统
- 创建访问点
- 设置持久化卷
- 重启相关服务

### ✅ verify-efs-storage.sh - EFS存储验证脚本
验证EFS存储是否正确配置和工作。

**使用方法：**
```bash
chmod +x verify-efs-storage.sh
./verify-efs-storage.sh
```

**检查项：**
- 持久化卷状态
- 持久化卷声明状态
- EFS CSI驱动状态
- StorageClass配置
- 服务挂载状态
- 文件系统访问测试

## 🔧 环境要求

### 必需工具
- kubectl - Kubernetes命令行工具
- docker - 容器运行时
- aws cli - AWS命令行工具
- mvn - Maven构建工具
- npm - Node.js包管理器

### AWS配置
- 配置AWS凭证：`aws configure`
- 设置正确的区域（默认：ca-central-1）
- ECR仓库访问权限

### Kubernetes配置
- kubectl上下文已配置
- 有权限操作merchant-system命名空间

## 📝 快速开始

### 1. 首次部署
```bash
# 1. 设置EFS存储（仅首次需要）
./setup-efs-storage.sh

# 2. 验证EFS存储
./verify-efs-storage.sh

# 3. 部署所有服务
./rapid-deploy.sh
# 选择 1 - 全部服务
```

### 2. 常用部署组合

#### 仅更新前端
```bash
./rapid-deploy.sh
# 选择 2 - 仅前端 (merchant-admin)
```

#### 前端 + 业务服务（最常用）
```bash
./rapid-deploy.sh
# 选择 3 - 前端 + 业务服务
# 适用于修改了业务逻辑和UI的情况
```

#### 仅更新业务服务
```bash
./rapid-deploy.sh
# 选择 4 - 仅业务服务 (business-service)
# 适用于只修改了后端业务逻辑
```

#### 更新所有后端服务
```bash
./rapid-deploy.sh
# 选择 5 - 仅后端 (所有Java服务)
```

#### 仅更新AI服务
```bash
./rapid-deploy.sh
# 选择 6 - 仅AI服务
```

### 3. 自定义部署
```bash
./rapid-deploy.sh
# 选择 7 - 自定义选择
# 输入需要的服务，例如: frontend business-service ai-service
```

## 🌐 访问地址

- **前端应用**: https://swiftmindsystems.com
- **API网关**: https://api.swiftmindsystems.com
- **健康检查**: https://api.swiftmindsystems.com/health

## 🔍 常用命令

### 查看Pod状态
```bash
kubectl get pods -n merchant-system
```

### 查看服务日志
```bash
# Business Service
kubectl logs -n merchant-system deployment/business-service -f

# AI Service
kubectl logs -n merchant-system deployment/ai-service-python -f

# Auth Service
kubectl logs -n merchant-system deployment/auth-service -f
```

### 查看最近事件
```bash
kubectl get events -n merchant-system --sort-by='.lastTimestamp'
```

### 重启服务
```bash
kubectl rollout restart deployment/business-service -n merchant-system
```

### 进入Pod调试
```bash
kubectl exec -it $(kubectl get pod -n merchant-system -l app=business-service -o jsonpath='{.items[0].metadata.name}') -n merchant-system -- /bin/sh
```

## 🐛 故障排查

### 1. Pod启动失败
```bash
# 查看Pod详情
kubectl describe pod <pod-name> -n merchant-system

# 查看Pod日志
kubectl logs <pod-name> -n merchant-system --previous
```

### 2. 镜像拉取失败
```bash
# 重新登录ECR
aws ecr get-login-password --region ca-central-1 | docker login --username AWS --password-stdin <ecr-registry>

# 检查ECR仓库
aws ecr describe-repositories --region ca-central-1
```

### 3. EFS挂载失败
```bash
# 运行EFS验证脚本
./verify-efs-storage.sh

# 检查EFS CSI驱动
kubectl get pods -n kube-system -l app=efs-csi-node
```

### 4. 服务无法访问
```bash
# 检查Ingress
kubectl get ingress -n merchant-system

# 检查Service
kubectl get svc -n merchant-system

# 检查ALB
aws elbv2 describe-load-balancers --region ca-central-1
```

## 📊 监控

### 查看资源使用
```bash
kubectl top nodes
kubectl top pods -n merchant-system
```

### 查看部署历史
```bash
kubectl rollout history deployment/business-service -n merchant-system
```

### 回滚部署
```bash
kubectl rollout undo deployment/business-service -n merchant-system
```

## 💡 注意事项

1. **版本管理**: 每次部署会自动生成版本号（时间戳+git commit）
2. **并行构建**: 脚本支持并行构建多个镜像，大幅提升部署速度
3. **增量部署**: 可以只部署修改的服务，无需全量部署
4. **EFS存储**: 首次部署需要配置EFS，之后无需重复配置
5. **清理镜像**: 部署后可选择清理本地Docker镜像，节省磁盘空间

## 🔐 安全建议

1. 定期轮换AWS凭证
2. 使用IAM角色而非长期凭证
3. 限制ECR仓库访问权限
4. 启用镜像扫描
5. 使用Kubernetes RBAC控制权限

## 📞 支持

如有问题，请检查：
1. AWS凭证是否有效
2. kubectl上下文是否正确
3. 所需工具是否已安装
4. 网络连接是否正常