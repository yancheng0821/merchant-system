# 通知服务Mock模式配置说明

## 概述

通知服务支持Mock模式，用于开发和测试环境，避免在开发过程中发送真实的邮件和短信。

## 配置说明

### 开发/测试环境配置 (application.yml)

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
```

### 生产环境配置 (application-prod.yml)

```yaml
notification:
  # 生产环境禁用Mock模式
  mock:
    enabled: false # 生产环境设置为false，使用真实的邮件和短信服务
  sms:
    provider: aws # 生产环境使用AWS SNS
    enabled: true
  email:
    provider: aws # 生产环境使用AWS SES
    enabled: true
```

## Mock模式功能

### 1. 邮件Mock
- ✅ 模拟邮件发送成功/失败
- ⏱️ 可配置发送延迟时间
- 📊 可配置成功率（模拟网络问题等）
- 📝 详细的日志输出，包含收件人、主题、内容长度等信息

### 2. 短信Mock
- ✅ 模拟短信发送成功/失败
- ⏱️ 可配置发送延迟时间
- 📊 可配置成功率（模拟网络问题等）
- 📝 详细的日志输出，包含手机号、内容等信息

## 日志示例

### 成功发送
```
2024-01-15 10:30:15 INFO  EmailService - ✅ Mock邮件发送成功 - 收件人：customer@example.com，主题：预约确认通知，内容长度：256
2024-01-15 10:30:16 INFO  SmsService - 📱 Mock短信发送成功 - 手机号：+8613800138000，内容：您的预约已确认...
```

### 模拟失败
```
2024-01-15 10:30:15 ERROR EmailService - ❌ Mock邮件发送失败 - 收件人：customer@example.com，主题：预约确认通知（模拟失败）
2024-01-15 10:30:16 ERROR SmsService - ❌ Mock短信发送失败 - 手机号：+8613800138000，内容：您的预约已确认...（模拟失败）
```

## 环境切换

### 开发环境
```bash
java -jar notification-service.jar --spring.profiles.active=dev
```

### 生产环境
```bash
java -jar notification-service.jar --spring.profiles.active=prod
```

### 环境变量方式
```bash
export NOTIFICATION_MOCK_ENABLED=false
java -jar notification-service.jar
```

## 配置参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `notification.mock.enabled` | boolean | true | 是否启用Mock模式 |
| `notification.mock.sms.simulateDelay` | boolean | true | 是否模拟短信发送延迟 |
| `notification.mock.sms.delayMs` | long | 1000 | 短信发送延迟时间（毫秒） |
| `notification.mock.sms.successRate` | double | 0.95 | 短信发送成功率（0.0-1.0） |
| `notification.mock.email.simulateDelay` | boolean | true | 是否模拟邮件发送延迟 |
| `notification.mock.email.delayMs` | long | 800 | 邮件发送延迟时间（毫秒） |
| `notification.mock.email.successRate` | double | 0.98 | 邮件发送成功率（0.0-1.0） |

## 注意事项

1. **生产环境务必禁用Mock模式**：在生产环境中，必须将 `notification.mock.enabled` 设置为 `false`
2. **成功率配置**：建议在测试环境中设置适当的失败率来测试错误处理逻辑
3. **延迟配置**：可以通过调整延迟时间来测试异步处理和超时场景
4. **日志级别**：开发环境可以设置为DEBUG级别查看详细的Mock内容

## 测试建议

1. **功能测试**：使用Mock模式快速验证通知发送逻辑
2. **性能测试**：调整延迟时间测试系统在网络延迟情况下的表现
3. **错误处理测试**：降低成功率测试系统的错误处理和重试机制
4. **集成测试**：在集成测试环境中使用Mock模式避免发送真实通知