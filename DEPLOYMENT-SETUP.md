# 🚀 AWS部署配置说明

## 📁 文件夹说明

### ✅ 应该保存到GitHub的文件

#### `terraform/` - 基础设施即代码
- ✅ **保存**: `main.tf`, `variables.tf`, `outputs.tf`, `security-groups.tf`
- ❌ **不保存**: `terraform.tfstate*`, `.terraform/` (已添加到.gitignore)

#### `docker/` - 容器化配置
- ✅ **保存**: 所有 `Dockerfile.*` 文件和 `nginx.conf`

#### `k8s-deployment/` - Kubernetes部署配置
- ✅ **保存**: 所有 `.yaml` 文件 (除了secrets)
- ⚠️ **注意**: `secrets.yaml` 包含敏感信息，使用 `secrets-template.yaml` 作为模板

#### `scripts/` - 部署脚本
- ✅ **保存**: `deploy.sh`, `build-and-push.sh`

## 🔐 敏感信息处理

### 1. Terraform状态文件
```bash
# 不要提交状态文件
terraform/*.tfstate
terraform/*.tfstate.*
terraform/.terraform/
```

### 2. Kubernetes Secrets
```bash
# 使用模板文件
cp k8s-deployment/secrets-template.yaml k8s-deployment/secrets.yaml

# 编辑真实值
vim k8s-deployment/secrets.yaml
```

### 3. 环境变量
```bash
# 不要提交环境文件
.env
.env.local
.env.production
```

## 🛠️ 部署前准备

### 1. 配置Secrets
```bash
# 复制模板
cp k8s-deployment/secrets-template.yaml k8s-deployment/secrets.yaml

# 编辑真实值
vim k8s-deployment/secrets.yaml
```

### 2. 配置Terraform
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### 3. 构建和部署
```bash
# 构建并推送镜像
./scripts/build-and-push.sh latest

# 部署到K8s
./scripts/deploy.sh
```

## 📋 安全检查清单

- [ ] 确认 `terraform.tfstate` 文件已添加到 `.gitignore`
- [ ] 确认 `secrets.yaml` 文件已添加到 `.gitignore`
- [ ] 确认所有敏感信息都已正确配置
- [ ] 确认Terraform状态文件已安全备份
- [ ] 确认AWS凭证已正确配置

## 🔄 团队协作

### 新成员加入时
1. 复制 `secrets-template.yaml` 为 `secrets.yaml`
2. 配置真实的敏感信息
3. 运行 `terraform init` 初始化基础设施
4. 运行部署脚本

### 环境变量管理
- 开发环境: 使用 `.env.local`
- 生产环境: 使用K8s ConfigMap和Secrets
- 不要提交任何包含真实密码的文件

## 📚 相关文档

- [AWS EKS部署指南](README-AWS-DEPLOYMENT.md)
- [Terraform配置说明](terraform/README.md)
- [Kubernetes配置说明](k8s-deployment/README.md) 