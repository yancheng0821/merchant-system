# 客户信息迁移系统

## 概述

客户信息迁移系统是一个完整的数据导入解决方案，帮助商户将历史客户数据（Excel、CSV、JSON）批量导入到系统中。系统支持自动识别数据格式、数据清洗与映射、批量导入、错误数据回滚与导入日志追踪。

## 功能特性

### 🚀 核心功能
- **多格式支持**: 支持 CSV、Excel (.xlsx/.xls) 文件格式
- **智能字段映射**: 自动识别并映射常见字段，支持手动调整
- **数据验证**: 实时验证数据格式、必填字段、重复数据检测
- **批量导入**: 支持大文件分批处理，避免系统压力
- **错误处理**: 详细的错误报告和数据回滚机制
- **导入日志**: 完整的导入历史记录和状态追踪

### 📊 数据验证规则
- 姓名、电话号码为必填字段
- 电话号码格式验证
- 邮箱格式验证（可选）
- 性别枚举值验证
- 重复数据检测（基于电话号码）

### 🔄 导入流程
1. **文件上传**: 上传 CSV 或 Excel 文件
2. **字段映射**: 将文件字段映射到系统字段
3. **数据预览**: 验证数据并预览导入结果
4. **执行导入**: 批量导入有效数据，跳过无效记录

## 技术架构

### 后端技术栈
- **Spring Boot**: 主框架
- **MyBatis**: 数据持久化
- **Apache POI**: Excel 文件处理
- **MySQL**: 数据存储
- **Spring Validation**: 数据验证

### 前端技术栈
- **React**: 用户界面
- **Material-UI**: UI 组件库
- **TypeScript**: 类型安全
- **Axios**: HTTP 客户端

### 数据库设计
```sql
-- 临时导入表
CREATE TABLE customer_import_temp (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    import_session_id VARCHAR(255) NOT NULL,
    row_index INT,
    raw_data JSON,
    status ENUM('PENDING','VALID','INVALID','IMPORTED'),
    error_message VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 导入日志表
CREATE TABLE customer_import_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    import_session_id VARCHAR(255) NOT NULL UNIQUE,
    file_name VARCHAR(255),
    total_records INT DEFAULT 0,
    success_records INT DEFAULT 0,
    failed_records INT DEFAULT 0,
    status ENUM('PROCESSING','COMPLETED','FAILED'),
    error_message VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
);
```

## API 接口

### 文件上传
```http
POST /api/business/customers/import/upload
Content-Type: multipart/form-data

Parameters:
- tenantId: 租户ID
- file: 上传的文件
```

### 字段映射验证
```http
POST /api/business/customers/import/mapping?tenantId={tenantId}
Content-Type: application/json

{
  "importSessionId": "uuid",
  "fieldMapping": {
    "原始字段名": "系统字段名"
  }
}
```

### 执行导入
```http
POST /api/business/customers/import/execute?tenantId={tenantId}
Content-Type: application/json

{
  "importSessionId": "uuid",
  "skipInvalidRecords": true
}
```

### 获取导入日志
```http
GET /api/business/customers/import/logs?tenantId={tenantId}
```

### 下载错误报告
```http
GET /api/business/customers/import/logs/{importSessionId}/error-report?tenantId={tenantId}
```

## 使用指南

### 1. 准备数据文件

创建 CSV 或 Excel 文件，包含以下字段（建议）：
- firstName: 名字
- lastName: 姓氏
- phone: 电话号码（必填）
- email: 邮箱地址
- address: 地址
- dateOfBirth: 生日 (格式: yyyy-MM-dd)
- gender: 性别 (MALE/FEMALE/OTHER/PREFER_NOT_TO_SAY)
- notes: 备注
- allergies: 过敏信息

### 2. 示例数据格式

CSV 示例：
```csv
firstName,lastName,phone,email,address,dateOfBirth,gender,notes,allergies
张,三,13800138001,zhangsan@example.com,北京市朝阳区,1990-01-01,MALE,VIP客户,无
李,四,13800138002,lisi@example.com,上海市浦东新区,1985-05-15,FEMALE,老客户,对花粉过敏
```

### 3. 导入步骤

1. **上传文件**: 在客户管理页面点击"批量导入"按钮
2. **选择文件**: 选择准备好的 CSV 或 Excel 文件
3. **字段映射**: 系统会自动识别字段，可手动调整映射关系
4. **数据预览**: 查看验证结果，确认有效和无效记录数量
5. **执行导入**: 确认无误后执行导入操作
6. **查看结果**: 查看导入结果和错误报告

### 4. 错误处理

- **格式错误**: 系统会标记格式不正确的记录
- **重复数据**: 基于电话号码检测重复客户
- **必填字段**: 检查姓名和电话号码是否为空
- **错误报告**: 可下载详细的错误报告 Excel 文件

## 配置说明

### 文件限制
- 最大文件大小: 10MB
- 支持格式: .csv, .xlsx, .xls
- 最大记录数: 建议不超过 10,000 条

### 字段映射选项
```javascript
const systemFields = {
  firstName: '名字',
  lastName: '姓氏', 
  phone: '电话',
  email: '邮箱',
  address: '地址',
  dateOfBirth: '生日',
  gender: '性别',
  notes: '备注',
  allergies: '过敏信息'
};
```

### 性别枚举值
- MALE: 男性
- FEMALE: 女性
- OTHER: 其他
- PREFER_NOT_TO_SAY: 不愿透露

## 部署说明

### 1. 数据库初始化
执行 SQL 脚本创建必要的表：
```bash
mysql -u username -p database_name < merchant-server/business-service/src/main/resources/db/migration/customer_import_tables.sql
```

### 2. 后端配置
确保 `pom.xml` 包含 Apache POI 依赖：
```xml
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi</artifactId>
    <version>5.2.4</version>
</dependency>
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>5.2.4</version>
</dependency>
```

### 3. 前端配置
确保导入了必要的组件：
```typescript
import { CustomerImport } from './components/CustomerImport';
import { ImportHistory } from './components/ImportHistory';
```

## 监控和维护

### 性能监控
- 监控文件上传时间
- 跟踪导入成功率
- 监控数据库临时表大小

### 数据清理
建议定期清理临时数据：
```sql
-- 清理7天前的临时数据
DELETE FROM customer_import_temp 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
```

### 日志管理
- 导入日志永久保存
- 错误日志详细记录
- 支持按租户查询历史记录

## 故障排除

### 常见问题

1. **文件上传失败**
   - 检查文件大小是否超过限制
   - 确认文件格式是否支持
   - 检查网络连接

2. **数据验证失败**
   - 检查必填字段是否为空
   - 确认数据格式是否正确
   - 查看详细错误信息

3. **导入速度慢**
   - 减少单次导入的记录数量
   - 检查数据库连接性能
   - 优化服务器资源配置

### 错误代码
- `UPLOAD_001`: 文件格式不支持
- `UPLOAD_002`: 文件大小超过限制
- `VALIDATION_001`: 必填字段为空
- `VALIDATION_002`: 数据格式错误
- `IMPORT_001`: 数据库连接失败
- `IMPORT_002`: 重复数据冲突

## 更新日志

### v1.0.0 (2024-01-29)
- ✅ 初始版本发布
- ✅ 支持 CSV 和 Excel 文件导入
- ✅ 智能字段映射功能
- ✅ 数据验证和错误处理
- ✅ 导入历史记录管理
- ✅ 错误报告下载功能

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。