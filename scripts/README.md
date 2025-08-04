# 部署脚本使用指南

本目录包含了智能化的部署脚本，确保每次部署都使用最新代码并自动进行测试验证。

## 📁 脚本文件

### 🚀 核心部署脚本

#### 1. `smart-deploy.sh` - 智能完整部署
**用途**: 完整部署所有服务，适用于重要版本发布或首次部署

**特点**:
- 自动生成版本号（基于时间戳和Git commit）
- 构建并推送所有服务镜像
- 自动更新K8s配置文件
- 按依赖顺序部署服务
- 自动健康检查和API测试
- 清理旧镜像

**使用方法**:
```bash
# 使用自动生成的版本号
./scripts/smart-deploy.sh

# 使用自定义版本号
./scripts/smart-deploy.sh v1.3.0
```

#### 2. `quick-deploy.sh` - 快速增量部署
**用途**: 只部署修改过的服务，适用于日常开发和快速更新

**特点**:
- 自动检测代码变更
- 只构建和部署修改过的服务
- 智能依赖管理
- 快速测试验证
- 大幅减少部署时间

**使用方法**:
```bash
# 使用自动生成的版本号
./scripts/quick-deploy.sh

# 使用自定义版本号
./scripts/quick-deploy.sh v1.3.0
```

#### 3. `check-deployment.sh` - 部署状态检查
**用途**: 检查当前部署状态和系统健康情况

**特点**:
- 检查Pod状态
- 显示镜像版本信息
- 检查服务状态和端点
- 验证API健康状态
- 生成详细部署报告

**使用方法**:
```bash
./scripts/check-deployment.sh
```

### 🏗️ 基础设施脚本

#### 4. `setup-efs-storage.sh` - EFS存储设置脚本
**用途**: 设置EFS共享存储（基础设施相关）

**特点**:
- 安装EFS CSI驱动
- 配置持久化存储
- 设置访问点
- 重启相关服务

**使用方法**:
```bash
./scripts/setup-efs-storage.sh
```

#### 5. `verify-efs-storage.sh` - EFS存储验证脚本
**用途**: 验证EFS存储配置和功能（基础设施相关）

**特点**:
- 检查持久化卷状态
- 验证存储类配置
- 测试文件系统访问
- 生成存储报告

**使用方法**:
```bash
./scripts/verify-efs-storage.sh
```

## 🚀 推荐使用流程

### 日常开发流程
```bash
# 1. 检查当前部署状态
./scripts/check-deployment.sh

# 2. 快速部署修改的服务
./scripts/quick-deploy.sh

# 3. 验证部署结果
./scripts/check-deployment.sh
```

### 重要版本发布流程
```bash
# 1. 完整部署所有服务
./scripts/smart-deploy.sh

# 2. 详细验证部署结果
./scripts/check-deployment.sh
```

## 📋 脚本功能对比

| 功能 | smart-deploy | quick-deploy | check-deployment | setup-efs | verify-efs |
|------|-------------|--------------|------------------|-----------|------------|
| 自动版本生成 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 代码变更检测 | ❌ | ✅ | ❌ | ❌ | ❌ |
| 增量部署 | ❌ | ✅ | ❌ | ❌ | ❌ |
| 完整构建 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 健康检查 | ✅ | ✅ | ✅ | ❌ | ❌ |
| API测试 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 状态报告 | ✅ | ✅ | ✅ | ❌ | ✅ |
| 镜像清理 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 存储设置 | ❌ | ❌ | ❌ | ✅ | ❌ |
| 存储验证 | ❌ | ❌ | ❌ | ❌ | ✅ |

## 🔧 版本号规则

### 自动生成版本号格式
```
v{YYYYMMDD}_{HHMMSS}_{GIT_COMMIT}
```

**示例**:
- `v20250804_143022_a1b2c3d`
- `v20250804_143022_unknown` (无Git仓库时)

### 自定义版本号格式
- 语义化版本: `v1.3.0`
- 时间戳版本: `v20250804_143022`
- 任意格式: `release_20250804`

## 🛠️ 环境要求

### 必需工具
- `kubectl` - Kubernetes命令行工具
- `docker` - Docker容器引擎
- `aws` - AWS命令行工具
- `curl` - HTTP请求工具

### 权限要求
- AWS ECR访问权限
- Kubernetes集群访问权限
- Docker构建权限

## 📊 部署监控

### 自动检查项目
- ✅ Pod运行状态
- ✅ 服务健康状态
- ✅ API可访问性
- ✅ 镜像版本一致性
- ✅ 资源使用情况

### 测试项目
- ✅ 前端可访问性
- ✅ AI服务API
- ✅ 头像API
- ✅ 服务启动日志

## 🚨 故障排除

### 常见问题

1. **镜像推送失败**
   ```bash
   # 检查AWS ECR登录状态
   aws ecr get-login-password --region ca-central-1 | docker login --username AWS --password-stdin ${ECR_REGISTRY}
   ```

2. **Pod启动失败**
   ```bash
   # 检查Pod日志
   kubectl logs -n merchant-system deployment/{service-name}
   
   # 检查Pod状态
   kubectl describe pod -n merchant-system {pod-name}
   ```

3. **服务无法访问**
   ```bash
   # 检查Ingress状态
   kubectl get ingress -n merchant-system
   
   # 检查服务端点
   kubectl get endpoints -n merchant-system
   ```

### 回滚操作
```bash
# 回滚到上一个版本
kubectl rollout undo deployment/{service-name} -n merchant-system

# 回滚到指定版本
kubectl rollout undo deployment/{service-name} -n merchant-system --to-revision=2
```

## 📝 日志和报告

### 日志位置
- 脚本执行日志: 控制台输出
- 服务日志: `kubectl logs -n merchant-system deployment/{service-name}`
- 集群事件: `kubectl get events -n merchant-system`

### 报告内容
- 部署版本信息
- Pod运行状态统计
- 服务健康状态
- API测试结果
- 资源使用情况

## 🔄 持续集成建议

### GitHub Actions示例
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy
        run: |
          ./scripts/smart-deploy.sh
```

### 自动化部署流程
1. 代码提交到主分支
2. 自动触发构建和测试
3. 自动部署到生产环境
4. 自动健康检查和通知

## 📞 支持

如有问题，请检查：
1. 脚本执行权限: `chmod +x scripts/*.sh`
2. 环境变量配置
3. AWS和Kubernetes权限
4. 网络连接状态 