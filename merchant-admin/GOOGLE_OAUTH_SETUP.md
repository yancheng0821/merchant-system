# Google OAuth 配置检查清单

## 当前配置
- **Client ID**: `567578445873-v336ul1tb9i08kvvm2vg3mkmoe5cvtfj.apps.googleusercontent.com`
- **前端域名**: `http://localhost:3000`
- **后端API**: `http://localhost:8080`

## Google Cloud Console 配置检查

### 1. 授权的 JavaScript 来源
确保在 Google Cloud Console 中添加了以下来源：
- `http://localhost:3000`
- `http://127.0.0.1:3000`

### 2. 授权的重定向 URI
确保添加了以下重定向URI：
- `http://localhost:3000`
- `http://localhost:3000/auth/callback`

### 3. API 启用状态
确保启用了以下API：
- Google+ API (已弃用，但可能仍需要)
- Google Identity API
- People API (可选)

## 常见问题排查

### 问题1: "unregistered_origin" 错误
**原因**: 当前域名未在Google控制台中注册
**解决**: 在Google Cloud Console的OAuth客户端配置中添加当前域名

### 问题2: "invalid_client" 错误  
**原因**: Client ID配置错误
**解决**: 检查前后端Client ID是否一致

### 问题3: Google API未加载
**原因**: 网络问题或脚本加载失败
**解决**: 检查网络连接，确保可以访问 accounts.google.com

### 问题4: 弹窗被阻止
**原因**: 浏览器阻止了弹窗
**解决**: 允许弹窗或使用redirect模式

## 测试步骤

1. 打开浏览器开发者工具
2. 访问应用登录页面
3. 点击Google登录按钮
4. 查看控制台输出的调试信息
5. 检查网络请求是否成功

## 调试命令

在浏览器控制台中运行：
```javascript
// 检查Google API
console.log('Google API:', typeof window.google);
console.log('Google accounts:', window.google?.accounts);
console.log('Google accounts.id:', window.google?.accounts?.id);

// 检查环境变量
console.log('Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);

// 检查当前域名
console.log('Origin:', window.location.origin);
```