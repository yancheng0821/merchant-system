# 通知服务 (Notification Service)

通知服务负责处理系统中的短信和邮件通知功能，支持预约确认、取消、完成和提醒等场景。

## 功能特性

- 📱 短信通知支持
- 📧 邮件通知支持
- 🎨 模板化消息内容
- 🔄 失败重试机制
- 📊 通知日志记录
- 🎯 基于用户偏好的通知方式选择

## 架构设计

### 核心组件

1. **NotificationService** - 核心通知服务
2. **TemplateService** - 模板管理服务
3. **EmailService** - 邮件发送服务
4. **SmsService** - 短信发送服务
5. **AppointmentNotificationService** - 预约通知专用服务

### 数据库表

- `notification_templates` - 通知模板表
- `notification_logs` - 通知发送日志表

## API 接口

### 预约通知接口

#### 1. 发送预约确认通知
```http
POST /api/v2/appointment-notifications/confirmation
Content-Type: application/json

{
  "appointmentId": 1,
  "tenantId": 1,
  "customerId": 1,
  "customerName": "张三",
  "customerPhone": "13800138000",
  "customerEmail": "zhangsan@example.com",
  "communicationPreference": "SMS",
  "appointmentDate": "2025-01-25",
  "appointmentTime": "14:30",
  "duration": 60,
  "totalAmount": 299.00,
  "staffName": "李美容师",
  "serviceName": "面部护理",
  "businessName": "美丽人生美容院",
  "businessAddress": "北京市朝阳区三里屯路123号",
  "businessPhone": "400-123-4567"
}
```

#### 2. 发送预约取消通知
```http
POST /api/v2/appointment-notifications/cancellation
```

#### 3. 发送预约完成通知
```http
POST /api/v2/appointment-notifications/completion
```

#### 4. 发送预约提醒通知
```http
POST /api/v2/appointment-notifications/reminder
```

### 模板管理接口

#### 1. 获取模板列表
```http
GET /api/notification-templates
```

#### 2. 创建模板
```http
POST /api/notification-templates
Content-Type: application/json

{
  "templateCode": "APPOINTMENT_CONFIRMED",
  "templateName": "预约确认短信模板",
  "type": "SMS",
  "content": "【${businessName}】尊敬的${customerName}，您的预约已确认！",
  "status": "ACTIVE"
}
```

#### 3. 更新模板
```http
PUT /api/notification-templates/{id}
```

#### 4. 删除模板
```http
DELETE /api/notification-templates/{id}
```

### 通知日志接口

#### 1. 获取通知日志
```http
GET /api/notification-logs?page=0&size=20&status=SENT
```

#### 2. 重试失败通知
```http
POST /api/notifications/retry-failed
```

## 模板变量

通知模板支持以下变量替换：

### 客户信息
- `${customerName}` - 客户姓名
- `${customerPhone}` - 客户电话
- `${customerEmail}` - 客户邮箱

### 预约信息
- `${appointmentDate}` - 预约日期
- `${appointmentTime}` - 预约时间
- `${duration}` - 服务时长
- `${totalAmount}` - 总金额
- `${serviceName}` - 服务名称
- `${staffName}` - 服务人员
- `${notes}` - 备注信息

### 商家信息
- `${businessName}` - 商家名称
- `${businessAddress}` - 商家地址
- `${businessPhone}` - 商家电话

## 配置说明

### application.yml 配置

```yaml
# 短信服务配置
sms:
  provider: mock # 可选值: aliyun, tencent, mock
  aliyun:
    access-key-id: your-access-key-id
    access-key-secret: your-access-key-secret
    sign-name: 您的签名
  tencent:
    secret-id: your-secret-id
    secret-key: your-secret-key
    app-id: your-app-id
    sign: 您的签名

# 邮件服务配置
email:
  provider: mock # 可选值: smtp, mock
  from: noreply@yourcompany.com
  from-name: 美容院预约系统

spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: your-email@gmail.com
    password: your-app-password
```

## 部署指南

### 1. 数据库初始化

```bash
# 执行数据库脚本
mysql -u root -p < sql/notification_tables.sql
```

### 2. 启动服务

```bash
# 启动通知服务
cd notification-service
mvn spring-boot:run
```

### 3. 测试服务

```bash
# 运行测试脚本
./test-notification.sh
```

## 集成指南

### Business Service 集成

在 business-service 中已经集成了通知功能：

1. **预约创建** - 自动发送确认通知
2. **预约取消** - 自动发送取消通知
3. **预约完成** - 自动发送完成通知

### 前端集成

前端管理界面包含：

1. **通知模板管理** - 创建、编辑、删除模板
2. **通知日志查看** - 查看发送历史和状态
3. **失败重试** - 手动重试失败的通知

## 扩展开发

### 添加新的通知类型

1. 在 `NotificationTemplate.NotificationType` 枚举中添加新类型
2. 实现对应的发送服务
3. 在 `NotificationServiceImpl` 中添加处理逻辑
4. 创建相应的模板

### 添加新的通知场景

1. 定义新的模板代码（如 `USER_REGISTERED`）
2. 创建对应的 DTO 和 API 接口
3. 在数据库中添加模板数据
4. 在业务服务中调用通知接口

## 监控和维护

### 日志监控

- 通知发送成功率
- 失败通知统计
- 重试次数监控

### 性能优化

- 异步发送通知
- 批量处理机制
- 缓存模板数据

### 故障排查

1. 检查数据库连接
2. 验证短信/邮件服务配置
3. 查看通知日志表中的错误信息
4. 检查模板格式和变量替换

## 常见问题

### Q: 短信发送失败怎么办？
A: 检查短信服务商配置，确认账户余额和签名设置。

### Q: 邮件发送失败怎么办？
A: 检查SMTP配置，确认邮箱授权码设置正确。

### Q: 如何自定义通知模板？
A: 通过前端管理界面或API接口创建和编辑模板。

### Q: 如何查看通知发送历史？
A: 通过前端通知日志页面或查询 notification_logs 表。