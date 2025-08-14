# Stripe Express Dashboard 访问机制说明

## 当前实现

### 问题背景
商户点击"打开Stripe控制台"按钮后，需要能直接访问他们自己的子账户（Connected Account）信息，而不是要求他们登录平台的主账户。

### 解决方案
使用 Stripe Express Dashboard Login Links 功能，为每个商户生成临时的、安全的登录链接。

## 技术实现

### 后端实现 (StripeConnectServiceImpl.java)

```java
@Override
public String getStripeDashboardUrl(Long tenantId) {
    // 1. 获取商户的Stripe账户信息
    StripeAccount account = stripeAccountMapper.selectByTenantId(tenantId);
    
    // 2. 使用Stripe API生成Express Dashboard登录链接
    LoginLink loginLink = LoginLink.createOnAccount(
        account.getStripeAccountId(),
        null,  // Express账户不需要额外参数
        null   // 使用默认的RequestOptions
    );
    
    // 3. 返回临时URL
    return loginLink.getUrl();
}
```

### 前端实现 (StripeConnectTab.tsx)

```javascript
const openStripeDashboard = async () => {
    // 1. 调用后端API获取登录链接
    const response = await axios.get(
        `/api/business/stripe-connect/account/${user.tenantId}/dashboard-url`
    );
    
    // 2. 在新窗口打开链接
    if (response.data?.data?.url) {
        window.open(response.data.data.url, '_blank');
    }
};
```

## 重要特性

### 1. 临时链接
- **有效期短**：链接通常只有几分钟的有效期
- **一次性使用**：链接使用后即失效
- **每次生成新链接**：不要缓存URL，每次都应该调用API生成新的

### 2. 无需额外登录
- 商户点击链接后直接进入他们的Stripe Express仪表板
- 不需要知道或输入任何Stripe账户密码
- 只能访问自己的子账户信息，无法访问平台主账户

### 3. 权限隔离
- 每个商户只能看到自己的：
  - 交易记录
  - 客户信息
  - 支付详情
  - 余额和转账记录
  - 终端设备

## Express Dashboard 功能限制

Express账户的Dashboard相比Standard账户有一些限制：

### 可以访问的功能
- ✅ 查看交易历史
- ✅ 查看客户列表
- ✅ 查看余额和转账
- ✅ 管理终端设备
- ✅ 下载报表
- ✅ 查看支付详情

### 不能访问的功能
- ❌ 修改账户设置（需要通过你的系统）
- ❌ 更改银行账户信息（需要通过onboarding流程）
- ❌ 创建API密钥
- ❌ 修改webhook设置

## 测试步骤

1. **创建测试商户账户**
   ```bash
   # 使用测试模式的Stripe账户
   ```

2. **完成onboarding流程**
   - 商户完成Stripe Connect入驻

3. **测试Dashboard访问**
   - 点击"打开Stripe控制台"按钮
   - 验证是否直接进入商户的Express Dashboard
   - 确认无需额外登录

## 常见问题

### Q: 为什么链接打开后显示"链接已过期"？
A: Express Dashboard登录链接有效期很短（通常5-10分钟），需要重新生成。

### Q: 商户能看到平台的其他商户信息吗？
A: 不能。每个商户只能访问自己的子账户数据。

### Q: 如果是Standard或Custom账户怎么办？
A: Standard和Custom账户有自己的登录凭证，需要商户自行登录Stripe Dashboard。

### Q: 能否生成永久的Dashboard链接？
A: 不能。出于安全考虑，Stripe不提供永久的免登录链接。

## 安全考虑

1. **不要缓存URL**：每次都应该实时生成
2. **记录访问日志**：记录谁在何时请求了Dashboard访问
3. **权限检查**：确保只有授权的商户能请求自己的Dashboard链接
4. **HTTPS传输**：确保所有API调用使用HTTPS

## 参考文档

- [Stripe Express Dashboard](https://stripe.com/docs/connect/express-dashboard)
- [Login Links API](https://stripe.com/docs/api/account_login_links)
- [Connect Account Types](https://stripe.com/docs/connect/accounts)