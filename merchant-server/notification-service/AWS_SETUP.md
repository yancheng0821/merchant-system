# AWS 通知服务配置指南

本文档介绍如何配置AWS SES（邮件服务）和AWS SNS（短信服务）用于通知功能。

## 前提条件

1. 拥有AWS账户
2. 安装并配置AWS CLI
3. 具备相应的IAM权限

## 本地开发配置

### 1. 安装AWS CLI

```bash
# macOS
brew install awscli

# 或者使用pip
pip install awscli
```

### 2. 配置AWS凭证

```bash
aws configure
```

输入以下信息：
- AWS Access Key ID
- AWS Secret Access Key  
- Default region name (例如: us-east-1)
- Default output format (json)

### 3. 验证配置

```bash
aws sts get-caller-identity
```

## AWS SES 邮件服务配置

### 1. 验证发送邮箱

在AWS SES控制台中验证你的发送邮箱地址：

1. 登录AWS控制台
2. 进入SES服务
3. 在左侧菜单选择"Verified identities"
4. 点击"Create identity"
5. 选择"Email address"
6. 输入邮箱地址并验证

### 2. 申请生产访问权限（可选）

默认情况下，SES处于沙盒模式，只能发送到已验证的邮箱。如需发送到任意邮箱：

1. 在SES控制台选择"Account dashboard"
2. 点击"Request production access"
3. 填写申请表单

### 3. 配置应用

在 `application.yml` 中配置：

```yaml
notification:
  email:
    provider: aws
    enabled: true
  aws:
    region: us-east-1
    useLocalCredentials: true
    ses:
      fromEmail: noreply@yourcompany.com
      fromName: 美容院预约系统
```

## AWS SNS 短信服务配置

### 1. 设置短信偏好

在AWS SNS控制台中：

1. 进入SNS服务
2. 选择"Text messaging (SMS)"
3. 在"Mobile settings"中配置：
   - Default message type: Transactional
   - Account spending limit: 设置合适的限额
   - Default sender ID: 你的应用名称（可选）

### 2. 配置应用

在 `application.yml` 中配置：

```yaml
notification:
  sms:
    provider: aws
    enabled: true
  aws:
    region: us-east-1
    useLocalCredentials: true
    sns:
      defaultSenderId: YourApp
      defaultMessageType: Transactional
```

## IAM 权限配置

确保你的AWS用户或角色具有以下权限：

### SES 权限

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail",
                "ses:SendRawEmail"
            ],
            "Resource": "*"
        }
    ]
}
```

### SNS 权限

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "sns:Publish"
            ],
            "Resource": "*"
        }
    ]
}
```

## 生产环境配置

在生产环境中，建议使用IAM角色而不是访问密钥：

```yaml
notification:
  aws:
    region: us-east-1
    useLocalCredentials: false
    accessKeyId: ${AWS_ACCESS_KEY_ID}
    secretAccessKey: ${AWS_SECRET_ACCESS_KEY}
```

或者使用环境变量：

```bash
export AWS_ACCESS_KEY_ID=your-access-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-access-key
export AWS_DEFAULT_REGION=us-east-1
```

## 测试配置

### 1. 启动服务

```bash
cd notification-service
mvn spring-boot:run
```

### 2. 运行测试脚本

```bash
./test-notification.sh
```

### 3. 检查日志

查看应用日志确认AWS服务初始化成功：

```
AWS SES客户端初始化成功，区域：us-east-1
AWS SNS客户端初始化成功，区域：us-east-1
```

## 故障排查

### 常见问题

1. **权限不足**
   - 检查IAM权限配置
   - 确认AWS凭证正确

2. **邮箱未验证**
   - 在SES控制台验证发送邮箱
   - 检查是否在沙盒模式

3. **短信发送失败**
   - 检查电话号码格式（需要包含国家代码）
   - 确认SNS在目标地区可用
   - 检查账户余额和限额

4. **区域配置错误**
   - 确保配置的区域支持SES/SNS服务
   - 检查资源是否在正确的区域

### 调试模式

启用详细日志：

```yaml
logging:
  level:
    software.amazon.awssdk: DEBUG
    com.merchant.server.notificationservice: DEBUG
```

## 成本优化

1. **选择合适的消息类型**
   - Transactional: 重要通知（价格较高）
   - Promotional: 营销消息（价格较低）

2. **监控使用量**
   - 设置CloudWatch告警
   - 定期检查费用报告

3. **优化发送频率**
   - 避免重复发送
   - 实现智能重试机制

## 安全建议

1. **使用最小权限原则**
2. **定期轮换访问密钥**
3. **启用CloudTrail日志记录**
4. **使用VPC端点（生产环境）**