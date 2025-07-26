# Merchant System - 商户管理系统

一个完整的商户管理系统，包含现代化的前端管理界面和微服务架构的后端系统。

## 🏗️ 系统架构

```
merchant-system/
├── merchant-admin/        # React前端管理界面
└── merchant-server/       # Spring Boot微服务后端
```

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
- 🛍️ 商品管理
- 📦 订单管理
- 👥 客户管理
- 📈 数据统计
- ⚙️ 系统设置

### 后端特性 (merchant-server)

- 🏢 微服务架构设计
- 🔐 多租户架构支持
- 🤖 AI智能功能（核心卖点）
- 🔒 多级权限控制
- 📊 数据分析服务
- 📧 通知通信服务
- 🌐 API网关统一入口

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
├── ai-service/           # AI智能服务 (端口: 8084)
├── analytics-service/     # 数据分析服务 (端口: 8085)
├── notification-service/  # 通知通信服务 (端口: 8086)
├── gateway-service/       # API网关服务 (端口: 8080)
├── eureka-server/        # 服务注册中心 (端口: 8761)
└── common/               # 公共模块
```

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

#### 数据库设计
- **统一资源表** (`resource`) - 支持员工和场地的统一管理
- **资源可用性表** (`resource_availability`) - 灵活的时间段管理
- **服务表扩展** - 添加 `resource_type` 字段支持不同资源需求
- **预约表扩展** - 添加资源关联字段

#### 后端实现
- **实体类** - `Resource`, `ResourceAvailability` 等完整的数据模型
- **服务层** - `ResourceService` 提供完整的资源管理功能
- **控制器** - `ResourceController` 提供RESTful API接口
- **MyBatis映射** - 完整的数据库操作支持

#### 前端组件
- **ResourceSelector组件** - 统一的资源选择器
  - 支持下拉框和卡片两种显示模式
  - 根据服务类型动态显示员工或房间
  - 实时可用性检查
  - 多语言支持

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

#### 查询服务可用资源
```http
GET /api/resources/service/123/tenant/1
```

#### 检查资源可用性
```http
GET /api/resources/456/availability/check?date=2024-01-15&startTime=14:30&endTime=16:00
```

### 业务场景支持

- **美容店** - 预约员工服务
- **KTV** - 预约包间
- **健身工作室** - 预约教练+场地

### 部署说明

1. 执行数据库迁移脚本：`merchant-server/sql/resource_tables.sql`
2. 重启后端服务以加载新的实体类和API
3. 前端组件已集成到预约对话框中，无需额外配置

## 🌍 国际化支持

系统支持中英文双语切换：

- 默认语言：中文（zh-CN）
- 支持语言：中文（zh-CN）和英文（en-US）
- 前端翻译文件：`merchant-admin/src/i18n/locales/`
- 后端翻译文件：`merchant-server/auth-service/src/main/resources/messages_*.properties`

## 📊 开发计划

### 第一阶段 (MVP) ✅

- [x] 项目架构搭建
- [x] 基础认证功能
- [x] 商户管理功能
- [x] 基础业务功能

### 第二阶段 (AI核心) 🚧

- [ ] AI智能推荐
- [ ] 数据分析功能
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