# Google OAuth 配置指南

## 问题描述
当前遇到 "unregistered_origin" 错误，这是因为 Google OAuth 客户端没有正确配置授权域名。

## 解决步骤

### 1. 访问 Google Cloud Console
1. 打开 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择你的项目

### 2. 启用必要的API
1. 转到 "API和服务" > "库"
2. 搜索并启用 "Google Identity API" 或 "Google+ API"

### 3. 配置OAuth客户端
1. 转到 "API和服务" > "凭据"
2. 找到客户端ID: `567578445873-v336ul1tb9i08kvvm2vg3mkmoe5cvtfj.apps.googleusercontent.com`
3. 点击编辑按钮

### 4. 添加授权域名
在 "授权的JavaScript来源" 部分添加以下域名：
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `https://localhost:3000` (如果使用HTTPS)
- 你的生产域名（如果有的话）

### 5. 保存配置
点击保存，等待几分钟让配置生效。

## 当前配置
- Client ID: `567578445873-v336ul1tb9i08kvvm2vg3mkmoe5cvtfj.apps.googleusercontent.com`
- 开发环境: `http://localhost:3000`

## 测试
配置完成后，重新加载页面并尝试Google登录。

## 注意事项
- 配置更改可能需要几分钟才能生效
- 确保域名完全匹配（包括协议和端口）
- 生产环境需要使用HTTPS