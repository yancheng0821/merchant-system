# 通知服务 (Notification Service)

通知服务负责处理系统中的短信和邮件发送功能，支持AWS SNS/SES和Mock模式。

## 功能特性

- 📱 **短信发送**: 支持AWS SNS发送短信
- 📧 **邮件发送**: 支持AWS SES和SMTP发送邮件
- 🔄 **重试机制**: 自动重试失败的发送请求
- 🧪 **Mock模式**: 开发测试环境使用Mock模式
- 📊 **健康检查**: 提供服务健康状态监控
- 🛡️ **配置验证**: 启动时验证AWS配置

## 配置说明

### 基本配置

```yaml
notification:
  # Mock模式配置 - 开发和测试环境使用
  mock:
    enabled: true # 设置为false时使用真实的邮件和短信服务
    sms:
      simulateDelay: true # 模拟发送延迟
      delayMs: 1000 # 模拟延迟时间（毫秒）
      successRate: 0.95 # 模拟成功率（0.0-1.0）
    email:
      simulateDelay: true
      delayMs: 800
      successRate: 0.98
  
  # 短信服务配置
  sms:
    provider: aws # aws, mock
    enabled: true
  
  # 邮件服务配置
  email:
    provider: aws # aws, smtp, mock
    from: noreply@yourcompany.com
    fromName: 美容院预约系统
    enabled: true
```

### AWS配置

```yaml
notification:
  aws:
    region: us-east-1
    useLocalCredentials: true # 本地测试时使用AWS CLI配置的凭证
    maxRetries: 3 # 最大重试次数
    retryDelayMs: 1000 # 重试间隔（毫秒）
    
    # 如果不使用本地凭证，请配置以下内容：
    # accessKeyId: your-access-key-id
    # secretAccessKey: your-secret-access-key
    
    # SES邮件服务配置
    ses:
      fromEmail: noreply@yourcompany.com
      fromName: 美容院预约系统
      # configurationSetName: your-configuration-set # 可选
    
    # SNS短信服务配置
    sns:
      defaultSenderId: YourApp # 可选，短信发送者ID
      defaultMessageType: Transactional # Promotional 或 Transactional
```

### SMTP备用配置

```yaml
notification:
  email:
    provider: smtp
    # SMTP配置（备用）
    host: smtp.gmail.com
    port: 587
    username: your-email@gmail.com
    password: your-app-password
    starttlsEnable: true
    auth: true
```

## AWS服务配置

### 1. AWS SES (邮件服务)

#### 前置条件
- AWS账户
- 已验证的发件人邮箱或域名
- 适当的IAM权限

#### IAM权限
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail",
                "ses:SendRawEmail",
                "ses:GetSendQuota",
                "ses:GetSendStatistics"
            ],
            "Resource": "*"
        }
    ]
}
```

#### 验证邮箱
1. 登录AWS控制台
2. 进入SES服务
3. 在"Verified identities"中添加发件人邮箱
4. 验证邮箱（检查邮件并点击验证链接）

### 2. AWS SNS (短信服务)

#### 前置条件
- AWS账户
- 适当的IAM权限
- 确认目标国家/地区支持SMS

#### IAM权限
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "sns:Publish",
                "sns:GetSMSAttributes",
                "sns:SetSMSAttributes"
            ],
            "Resource": "*"
        }
    ]
}
```

#### 配置SMS属性
```bash
# 设置默认发送者ID
aws sns set-sms-attributes --attributes DefaultSenderID=YourApp

# 设置默认消息类型
aws sns set-sms-attributes --attributes DefaultSMSType=Transactional

# 设置月度支出限制
aws sns set-sms-attributes --attributes MonthlySpendLimit=10
```

## 使用方法

### 1. 发送短信

```java
@Autowired
private SmsService smsService;

// 发送短信
boolean success = smsService.sendSms("+8613800138000", "您的验证码是：123456");
```

### 2. 发送邮件

```java
@Autowired
private EmailService emailService;

// 发送邮件
boolean success = emailService.sendEmail(
    "user@example.com", 
    "预约确认", 
    "您的预约已确认，时间：2024-01-01 10:00"
);
```

### 3. 健康检查

```bash
# 获取服务健康状态
GET /api/notification/health

# 发送测试短信
POST /api/notification/health/test/sms?phoneNumber=+8613800138000

# 发送测试邮件
POST /api/notification/health/test/email?email=test@example.com
```

## 环境配置

### 开发环境
- 使用Mock模式 (`mock.enabled: true`)
- 可以测试发送逻辑而不实际发送

### 测试环境
- 可以使用真实AWS服务进行集成测试
- 建议使用专门的测试邮箱和手机号

### 生产环境
- 禁用Mock模式 (`mock.enabled: false`)
- 使用环境变量配置敏感信息
- 启用监控和日志

## 环境变量

生产环境建议使用环境变量：

```bash
# AWS配置
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=your-access-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-access-key

# 邮件配置
export EMAIL_FROM=noreply@yourcompany.com
export EMAIL_FROM_NAME=美容院预约系统

# SES配置
export AWS_SES_FROM_EMAIL=noreply@yourcompany.com
export AWS_SES_FROM_NAME=美容院预约系统

# SNS配置
export AWS_SNS_SENDER_ID=YourApp

# 重试配置
export AWS_MAX_RETRIES=3
export AWS_RETRY_DELAY_MS=1000
```

## 故障排除

### 常见问题

1. **SES邮件发送失败**
   - 检查发件人邮箱是否已验证
   - 确认AWS凭证是否正确
   - 检查IAM权限

2. **SNS短信发送失败**
   - 确认目标国家是否支持SMS
   - 检查手机号格式（需要包含国家代码）
   - 确认月度支出限制

3. **AWS凭证问题**
   - 本地开发：确保AWS CLI已配置
   - 生产环境：检查环境变量或IAM角色

### 日志查看

```bash
# 查看通知服务日志
tail -f /var/log/notification-service/application.log

# 查看特定级别日志
grep "ERROR" /var/log/notification-service/application.log
```

## 监控指标

建议监控以下指标：
- 短信发送成功率
- 邮件发送成功率
- 发送延迟
- 错误率
- AWS服务配额使用情况

## 安全建议

1. 使用IAM角色而不是硬编码凭证
2. 定期轮换访问密钥
3. 设置适当的发送限制
4. 监控异常发送活动
5. 验证输入参数防止注入攻击