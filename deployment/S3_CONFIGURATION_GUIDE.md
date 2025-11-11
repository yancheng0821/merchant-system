# AWS S3文件存储配置指南

## 概述

系统已配置AWS S3作为生产环境的文件存储方案，支持水平扩展多个auth-service实例。本地开发环境保持使用本地文件系统存储。

## 配置模式

系统支持三种文件存储模式：

1. **local** - 本地文件系统存储（本地开发环境）
2. **s3** - AWS S3存储（生产环境推荐）
3. **dual** - 双写模式（迁移期间使用，同时写入本地和S3）

## 环境配置

### 1. 本地开发环境

**配置文件**: `merchant-server/auth-service/src/main/resources/application.yml`

```yaml
file:
  upload:
    path: /Users/aisenyc/merchant-system/uploads
    mode: local  # 本地开发使用local模式

# S3配置留空，不初始化S3Service
```

**特点**:
- 文件存储在本地项目目录
- 通过`/static/uploads/`路径访问
- 不需要AWS配置
- 适合单机开发和测试

### 2. 生产环境

**配置文件**: `merchant-server/auth-service/src/main/resources/application-prod.yml`

```yaml
file:
  upload:
    path: ${UPLOAD_PATH:/var/uploads}
    mode: ${FILE_UPLOAD_MODE:s3}  # 默认s3模式

aws:
  s3:
    bucket-name: ${AWS_S3_BUCKET_NAME:}
    region: ${AWS_S3_REGION:ca-central-1}
    url-expiration-hours: 24
```

**环境变量**: `deployment/.env`

```bash
FILE_UPLOAD_MODE=s3
AWS_S3_BUCKET_NAME=vamerchant-uploads
AWS_S3_REGION=ca-central-1
```

**特点**:
- 文件存储在AWS S3
- 支持多实例水平扩展
- 使用EC2 Instance Profile自动获取AWS凭证（无需明文密钥）
- 文件通过S3 URL访问

## AWS资源配置

### S3 Bucket

- **名称**: `vamerchant-uploads`
- **区域**: `ca-central-1`
- **权限**: 公共读取（GetObject）
- **CORS**: 已配置允许跨域访问

### IAM配置

**EC2 Instance Profile**: `MerchantEC2Role`
- 已附加策略: `VaMerchantS3UploadPolicy`
- 权限: s3:PutObject, s3:GetObject, s3:DeleteObject, s3:ListBucket

**优势**:
- 无需在配置文件中存储AWS密钥
- EC2实例自动获取临时凭证
- 更安全的凭证管理

## 代码实现

### S3Service.java

使用AWS SDK默认凭证提供者链：

```java
this.s3Client = S3Client.builder()
    .region(Region.of(region))
    .build();  // 自动使用EC2 Instance Profile
```

**凭证查找顺序**:
1. 环境变量 (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
2. EC2 Instance Metadata (Instance Profile)
3. ECS Task Role
4. 配置文件 (~/.aws/credentials)

### FileUploadController.java

支持三种模式的智能切换：

- **s3模式**: 仅上传到S3，返回S3 URL
- **local模式**: 仅保存到本地文件系统
- **dual模式**: 同时写入S3和本地（用于迁移）

## 文件URL格式

### 本地开发环境
```
/static/uploads/avatars/tenant_1/uuid.jpg
```
通过Gateway代理访问本地文件系统

### 生产环境
```
https://vamerchant-uploads.s3.ca-central-1.amazonaws.com/uploads/avatars/tenant_1/uuid.jpg
```
直接从S3访问，无需通过Gateway

## 迁移现有文件（可选）

如果需要迁移容器中已有的文件到S3：

### 方法1: 使用dual模式过渡

1. 设置 `FILE_UPLOAD_MODE=dual`
2. 新上传的文件会同时写入本地和S3
3. 手动迁移旧文件到S3
4. 验证后切换到 `FILE_UPLOAD_MODE=s3`

### 方法2: AWS CLI批量上传

```bash
# 从EC2实例上传现有文件
ssh -i deployment/merchant-system-key.pem ubuntu@35.182.43.233
docker exec auth-service bash -c "cd /var/uploads && tar -czf - ." > uploads.tar.gz
aws s3 sync /var/uploads/ s3://vamerchant-uploads/uploads/
```

## 切换存储模式

### 从local切换到s3

1. 确保AWS资源已配置
2. 更新 `FILE_UPLOAD_MODE=s3`
3. 重启auth-service
4. 验证文件上传功能

### 从s3切换到local

1. 更新 `FILE_UPLOAD_MODE=local`
2. 重启auth-service
3. 可选：从S3下载文件到本地

## 监控和日志

### S3Service初始化日志

```
Initializing S3 client with bucket: vamerchant-uploads, region: ca-central-1
S3 client initialized successfully using default credentials provider
```

### 文件上传日志

```
Upload mode: s3
Uploading file to S3: bucket=vamerchant-uploads, key=uploads/avatars/tenant_1/uuid.jpg
File uploaded successfully: https://...
```

## 成本估算

基于以下假设：
- 平均文件大小: 100KB
- 每天上传: 100个文件
- 每月存储: 3000个文件

**月度成本**:
- 存储 (300MB): ~$0.01 CAD
- PUT请求 (3000): ~$0.02 CAD
- GET请求 (100,000): ~$0.05 CAD
- 数据传输 (10GB): ~$1.20 CAD

**总计**: ~$1.28 CAD/月

## 故障排查

### 问题1: S3Service未初始化

**错误**: `S3 client not configured`

**解决**:
- 检查 `AWS_S3_BUCKET_NAME` 是否配置
- 检查EC2 Instance Profile是否正确附加

### 问题2: 权限被拒绝

**错误**: `Access Denied` when uploading

**解决**:
- 验证IAM策略是否包含 `s3:PutObject` 权限
- 检查S3 bucket策略

### 问题3: 文件无法访问

**错误**: 上传成功但URL返回403

**解决**:
- 确认bucket policy允许公共GetObject
- 检查CORS配置

## 安全最佳实践

✅ **已实施**:
- 使用EC2 Instance Profile（无明文密钥）
- S3 bucket仅允许GetObject公共访问
- PutObject/DeleteObject需要IAM权限

✅ **推荐后续优化**:
- 启用S3版本控制
- 配置S3生命周期策略（自动归档旧文件）
- 添加CloudFront CDN加速（可选）
- 启用S3访问日志

## 相关文件

- `S3Service.java` - S3操作服务
- `FileUploadController.java` - 文件上传控制器
- `application.yml` - 本地开发配置
- `application-prod.yml` - 生产环境配置
- `docker-compose.production.yml` - Docker配置
- `.env` - 环境变量
- `S3_MIGRATION_PLAN.md` - 详细迁移计划

## 支持

如有问题，请检查：
1. auth-service容器日志: `docker logs auth-service`
2. S3 bucket权限配置
3. EC2 Instance Profile配置
