# Merchant System - 商户管理系统

一个完整的商户管理系统，包含现代化的前端管理界面和微服务架构的后端系统。

## 🏗️ 系统架构

```
merchant-system/
├── merchant-admin/        # React前端管理界面
└── merchant-server/       # Spring Boot微服务后端
```

## ✨ 功能特性总览

### 🏪 商户管理
- 多租户架构支持
- 商户信息管理
- 商户配置管理
- 权限控制

### 📅 预约管理
- 统一资源预约系统
- 员工和房间管理
- 可用性管理
- 预约冲突检测
- 预约历史记录

### 👥 客户管理
- 客户信息管理
- 客户标签分类
- 客户行为分析
- 客户关系维护

### 💰 订单支付
- 订单管理
- 支付流程
- 支付记录
- 退款处理

### 🛍️ 服务管理
- 服务项目管理
- 服务分类管理
- 价格管理
- 服务配置

### 📊 数据分析
- 收入统计分析
- 服务统计分析
- 资源利用率分析
- 客户行为分析
- 实时数据展示

### 📧 通知系统
- 短信通知（AWS SNS）
- 邮件通知（AWS SES）
- 通知模板管理
- 通知日志记录
- 健康状态监控

### ⚙️ 系统设置
- 系统参数配置
- 用户权限管理
- 界面个性化设置
- 多语言支持

## 🎯 核心特性

### 前端特性 (merchant-admin)

- 🎨 基于Material-UI的现代化界面设计
- ✨ Inter字体 - 优雅现代的界面字体
- 📱 响应式布局，支持移动端
- 🔧 TypeScript支持，提供完整的类型检查
- 🌍 国际化支持，支持中英文切换
- 🔐 用户认证系统，支持登录/登出
- 👤 用户资料管理和编辑功能
- 📊 仪表盘数据展示
- 📅 预约管理系统
- 🏢 资源管理（员工/房间）
- 👥 客户管理
- 💰 订单和支付管理
- 📈 数据分析和统计
- 📧 通知管理
- ⚙️ 系统设置

### 后端特性 (merchant-server)

- 🏢 微服务架构设计
- 🔐 多租户架构支持
- 🤖 AI智能功能（核心卖点）
- 🔒 多级权限控制
- 📅 统一资源预约系统
- 📊 数据分析服务
- 📧 通知通信服务（支持AWS SNS/SES）
- 🌐 API网关统一入口
- 🔄 自动重试机制
- 📈 健康检查和监控

## 🚀 快速开始

### 环境要求

#### 前端环境

- Node.js 16+
- npm 8+

#### 后端环境

- Java 17+
- Maven 3.6+
- MySQL 8.0+
- Redis 6.0+
- RabbitMQ 3.8+

### 启动步骤

#### 1. 启动后端服务

```bash
# 进入后端目录
cd merchant-server

# 构建整个项目
mvn clean install

# 启动各个微服务（按顺序）
cd eureka-server && mvn spring-boot:run
cd auth-service && mvn spring-boot:run
cd merchant-service && mvn spring-boot:run
cd business-service && mvn spring-boot:run
cd ai-service && mvn spring-boot:run
cd analytics-service && mvn spring-boot:run
cd notification-service && mvn spring-boot:run
cd gateway-service && mvn spring-boot:run
```

#### 2. 启动前端服务

```bash
# 进入前端目录
cd merchant-admin

# 安装依赖
npm install

# 启动开发服务器
npm start
```

前端将在 http://localhost:3000 启动

### 数据库配置

创建以下数据库：

```sql
CREATE DATABASE merchant_auth;
CREATE DATABASE merchant_management;
CREATE DATABASE merchant_business;
CREATE DATABASE merchant_ai;
CREATE DATABASE merchant_analytics;
CREATE DATABASE merchant_notification;
```

## 📁 项目结构

### 前端结构 (merchant-admin)

```
merchant-admin/
├── src/
│   ├── components/            # 通用组件
│   │   ├── auth/             # 认证相关组件
│   │   └── index.ts          # 组件统一导出
│   ├── modules/              # 业务模块
│   │   ├── dashboard/        # 仪表盘模块
│   │   ├── products/         # 商品管理模块
│   │   ├── orders/           # 订单管理模块
│   │   ├── customers/        # 客户管理模块
│   │   ├── analytics/        # 数据统计模块
│   │   ├── settings/         # 系统设置模块
│   │   └── index.ts          # 模块统一导出
│   ├── contexts/             # React Context状态管理
│   ├── i18n/                 # 国际化多语言支持
│   └── services/             # API服务
```

### 后端结构 (merchant-server)

```
merchant-server/
├── auth-service/          # 认证授权服务 (端口: 8081)
├── merchant-service/      # 商户管理服务 (端口: 8082)
├── business-service/      # 业务核心服务 (端口: 8083)
├── ai-service/           # AI智能服务 (端口: 8085)
├── analytics-service/     # 数据分析服务 (端口: 8086)
├── notification-service/  # 通知通信服务 (端口: 8084)
├── gateway-service/       # API网关服务 (端口: 8080)
├── eureka-server/        # 服务注册中心 (端口: 8761)
├── common/               # 公共模块
└── sql/                  # 数据库脚本
    └── schema/           # 数据库表结构
```

## 🚀 技术亮点

### 🏗️ 微服务架构
- Spring Cloud微服务生态
- Eureka服务注册与发现
- Gateway API网关统一入口
- 服务间通信与负载均衡

### 🔐 多租户架构
- 数据隔离设计
- 租户级别的权限控制
- 灵活的配置管理
- 可扩展的业务模型

### 📅 统一资源管理
- 员工和场地统一建模
- 灵活的可用性管理
- 实时冲突检测
- 可视化时间管理

### 📧 企业级通知服务
- AWS SNS/SES集成
- 自动重试机制
- 健康检查监控
- Mock模式支持

### 🎨 现代化前端
- Material-UI设计系统
- TypeScript类型安全
- 响应式布局设计
- 国际化多语言支持

### 📊 数据分析能力
- 实时数据统计
- 多维度分析报表
- 可视化图表展示
- 业务洞察支持

## 🔧 技术栈

### 前端技术栈

- React 18
- Material-UI (MUI) 5
- TypeScript
- React Router Dom (路由管理)
- Emotion (CSS-in-JS)
- i18next + react-i18next (国际化)
- Context API (状态管理)

### 后端技术栈

- Spring Boot 3.2.0
- Spring Cloud 2023.0.0
- Spring Security
- Spring Data JPA
- MySQL 8.0
- Redis
- RabbitMQ
- Eureka
- Spring Cloud Gateway

## 🌐 API网关路由

- 认证服务: `http://localhost:8080/api/auth/**`
- 商户服务: `http://localhost:8080/api/merchant/**`
- 业务服务: `http://localhost:8080/api/business/**`
- AI服务: `http://localhost:8080/api/ai/**`
- 分析服务: `http://localhost:8080/api/analytics/**`
- 通知服务: `http://localhost:8080/api/notification/**`

## 📸 系统界面展示

### 登录界面
![登录界面](images/login.png)

### 仪表盘
![仪表盘](images/dashboard.png)

### 预约管理
![预约管理](images/appointments.png)

#### 添加预约流程
![添加预约1](images/add_appointment1.png)
![添加预约2](images/add_appointment2.png)
![添加预约3](images/add_appointment3.png)
![添加预约4](images/add_appointment4.png)

#### 预约历史
![预约历史](images/appointment_history.png)

### 资源管理

#### 员工管理
![员工管理](images/resources_staff.png)

#### 员工可用性管理
![员工可用性](images/staff_availability.png)
![员工可用性详情](images/staff_availability_detail.png)

#### 房间管理
![房间管理](images/resource_room.png)

#### 房间可用性管理
![房间可用性](images/room_availability.png)
![房间可用性详情](images/room_availability_detail.png)

### 客户管理
![客户管理](images/customer.png)

### 订单管理
![订单管理](images/orders.png)

### 支付管理
![支付管理](images/payment.png)

### 服务管理
![服务管理](images/service_management.png)
![服务分类管理](images/manage_service_categories.png)

### 数据分析
![数据分析1](images/analytics1.png)
![数据分析2](images/analytics2.png)
![数据分析3](images/analytics3.png)

### 通知管理
![通知管理](images/notification.png)
![通知日志](images/notification_logs.png)

### 系统设置
![系统设置1](images/settings1.png)
![系统设置2](images/settings2.png)
![系统设置3](images/settings3.png)

### 用户资料
![用户资料](images/user_profile.png)

## 🔐 演示账号

### 前端登录账号

- **系统管理员**: `admin` / `admin123`
- **商户管理员**: `merchant` / `merchant123`

## 🤖 AI智能功能

### 核心AI特性

- 智能预约推荐
- 客户行为分析
- 服务需求预测
- 智能定价建议
- 员工排班优化
- 客户流失预警

## 📅 统一资源预约系统

### 系统概述

实现了员工和场地的统一预约逻辑，支持不同商户预约不同类型的资源：
- 美容店预约"员工"
- KTV商户预约"包间"  
- 健身工作室预约"员工 + 场地"

### 核心特性

#### 资源管理界面
- **员工管理** - 支持员工信息管理、技能设置、工作时间配置
- **房间管理** - 支持房间信息管理、设施配置、容量设置
- **可用性管理** - 可视化的时间段管理，支持详细的可用性查看

#### 预约流程
- **智能预约** - 根据服务类型自动匹配可用资源
- **时间冲突检测** - 实时检查资源可用性，避免重复预约
- **多步骤预约** - 引导式预约流程，提升用户体验
- **预约历史** - 完整的预约记录管理

#### 数据库设计
- **统一资源表** (`resource`) - 支持员工和场地的统一管理
- **资源可用性表** (`resource_availability`) - 灵活的时间段管理
- **资源预约时段表** (`resource_booking_slot`) - 精确的预约时间管理
- **服务表扩展** - 添加 `resource_type` 字段支持不同资源需求

#### 后端实现
- **实体类** - `Resource`, `ResourceAvailability`, `ResourceBookingSlot` 等完整的数据模型
- **服务层** - `ResourceService` 提供完整的资源管理功能
- **控制器** - `ResourceController` 提供RESTful API接口
- **MyBatis映射** - 完整的数据库操作支持

#### 前端组件
- **ResourceSelector组件** - 统一的资源选择器
- **DetailedAvailabilityView组件** - 详细的可用性查看
- **ResourceAvailabilityDisplay组件** - 资源可用性展示
- **SmartTimeSelector组件** - 智能时间选择器

### API接口示例

#### 创建预约记录
```http
POST /api/appointments
Content-Type: application/json

{
  "tenantId": 1,
  "customerId": 123,
  "resourceId": 456,
  "resourceType": "STAFF",
  "appointmentDate": "2024-01-15",
  "appointmentTime": "14:30:00",
  "duration": 90,
  "totalAmount": 150.00,
  "status": "CONFIRMED"
}
```

#### 查询资源详细可用性
```http
GET /api/resources/456/detailed-availability?date=2024-01-15
```

#### 检查资源可用性
```http
GET /api/resources/456/availability/check?date=2024-01-15&startTime=14:30&endTime=16:00
```

### 业务场景支持

- **美容店** - 预约员工服务，支持技师技能匹配
- **KTV** - 预约包间，支持房间类型和容量选择
- **健身工作室** - 预约教练+场地，支持复合资源预约

## 🌍 国际化支持

系统支持中英文双语切换：

- 默认语言：中文（zh-CN）
- 支持语言：中文（zh-CN）和英文（en-US）
- 前端翻译文件：`merchant-admin/src/i18n/locales/`
- 后端翻译文件：`merchant-server/auth-service/src/main/resources/messages_*.properties`

## 📧 通知服务系统

### 通知服务特性

- **多渠道支持** - 支持短信（AWS SNS）和邮件（AWS SES/SMTP）
- **Mock模式** - 开发测试环境支持Mock模式
- **重试机制** - 自动重试失败的发送请求
- **健康检查** - 实时监控服务状态
- **配置验证** - 启动时验证AWS配置

### 支持的通知类型

- 📅 预约确认通知
- 🔔 预约提醒通知
- 💰 支付成功通知
- ❌ 预约取消通知
- 📊 系统状态通知

### 配置示例

```yaml
notification:
  mock:
    enabled: false  # 生产环境使用真实服务
  aws:
    region: us-east-1
    maxRetries: 3
    retryDelayMs: 1000
    ses:
      fromEmail: noreply@yourcompany.com
      fromName: 美容院预约系统
    sns:
      defaultSenderId: YourApp
      defaultMessageType: Transactional
```

## 📊 开发计划

### 第一阶段 (MVP) ✅

- [x] 项目架构搭建
- [x] 基础认证功能
- [x] 商户管理功能
- [x] 基础业务功能
- [x] 统一资源预约系统
- [x] 通知服务系统

### 第二阶段 (AI核心) 🚧

- [x] 数据分析功能
- [ ] AI智能推荐
- [ ] 智能定价

### 第三阶段 (企业级) 📋

- [ ] 高级AI功能
- [ ] 性能优化
- [ ] 监控告警

## 🛠️ 开发指南

### 前端开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start

# 构建生产版本
npm run build

# 运行测试
npm test
```

### 后端开发

```bash
# 构建项目
mvn clean install

# 运行单个服务
mvn spring-boot:run

# 运行测试
mvn test
```

## 📝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

MIT License

## 🤝 联系我们

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件
- 创建 Pull Request 