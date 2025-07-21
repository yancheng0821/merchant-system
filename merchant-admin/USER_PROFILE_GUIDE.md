# 用户资料功能使用指南

## 功能概述

用户资料功能允许用户查看和编辑个人信息，包括：
- 基本信息（用户名、真实姓名、邮箱）
- 头像上传和管理
- 租户信息显示
- 角色和权限信息

## 后端API接口

### 1. 获取用户信息
```
GET /api/users/profile
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "success": true,
  "message": "获取用户信息成功",
  "data": {
    "userId": 1,
    "username": "admin",
    "realName": "系统管理员",
    "email": "admin@example.com",
    "avatar": "/api/users/avatar/abc123.jpg",
    "tenantId": 1,
    "tenantName": "默认租户",
    "roles": ["ROLE_MERCHANT_ADMIN"],
    "permissions": ["READ", "WRITE"],
    "lastLoginTime": "2024-01-01T10:00:00",
    "updateTime": "2024-01-01T10:00:00"
  }
}
```

### 2. 更新用户信息
```
PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": 1,
  "username": "admin",
  "realName": "系统管理员",
  "email": "admin@example.com"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "更新用户信息成功",
  "data": {
    "userId": 1,
    "username": "admin",
    "realName": "系统管理员",
    "email": "admin@example.com",
    "avatar": "/api/users/avatar/abc123.jpg",
    "tenantId": 1,
    "tenantName": "默认租户",
    "roles": ["ROLE_MERCHANT_ADMIN"],
    "permissions": ["READ", "WRITE"],
    "lastLoginTime": "2024-01-01T10:00:00",
    "updateTime": "2024-01-01T10:00:00"
  }
}
```

### 3. 上传头像
```
POST /api/users/avatar
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- avatar: [图片文件]
```

**响应示例：**
```json
{
  "success": true,
  "message": "头像上传成功",
  "data": {
    "userId": 1,
    "avatarUrl": "/api/users/avatar/def456.jpg",
    "originalFileName": "profile.jpg",
    "fileSize": 102400,
    "fileType": "image/jpeg"
  }
}
```

## 前端使用

### 1. 访问用户资料页面
在导航栏中点击用户头像，选择"用户资料"菜单项。

### 2. 编辑个人信息
1. 点击"编辑资料"按钮
2. 修改用户名、真实姓名或邮箱
3. 点击"保存更改"按钮

### 3. 上传头像
1. 点击头像上的相机图标
2. 选择图片文件（支持JPG、PNG格式，最大5MB）
3. 系统会自动上传并更新头像

## 配置说明

### 后端配置
在 `application.yml` 中配置头像上传路径：

```yaml
app:
  avatar:
    upload:
      path: ${user.home}/merchant-system/avatars  # 头像上传路径
    url:
      prefix: /api/users/avatar/  # 头像访问URL前缀
```

### 前端配置
在 `src/services/api.ts` 中配置API基础URL：

```typescript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081';
```

## 安全特性

1. **JWT认证**：所有API请求都需要有效的JWT令牌
2. **用户验证**：只能修改自己的用户信息
3. **文件验证**：头像上传支持文件类型和大小验证
4. **数据验证**：用户名和邮箱唯一性检查

## 错误处理

### 常见错误码
- `400`：请求参数错误
- `401`：未授权访问
- `403`：权限不足
- `404`：用户不存在
- `409`：用户名或邮箱已存在
- `413`：文件过大
- `415`：不支持的文件类型

### 错误响应格式
```json
{
  "success": false,
  "message": "错误描述",
  "data": null
}
```

## 测试

### 运行API测试
```bash
cd merchant-admin
node test-api.js
```

### 手动测试
1. 启动后端服务
2. 启动前端服务
3. 登录系统
4. 访问用户资料页面
5. 测试编辑和上传功能

## 注意事项

1. 头像文件会保存在服务器本地文件系统中
2. 建议定期清理未使用的头像文件
3. 在生产环境中，建议使用云存储服务
4. 确保上传目录有适当的读写权限
5. 考虑添加图片压缩和格式转换功能

## 扩展功能

可以考虑添加以下功能：
- 密码修改
- 手机号码绑定
- 邮箱验证
- 双因素认证
- 登录历史记录
- 账户安全设置 