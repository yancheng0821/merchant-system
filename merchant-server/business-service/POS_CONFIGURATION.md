# POS支付配置说明

## 环境配置

### 开发环境 (默认)
- Mock模式：启用
- 成功率：95%
- 处理延迟：3秒

### 测试环境 (application-test.yml)
- Mock模式：启用
- 成功率：95%
- 处理延迟：2秒
- 完整的支付调用链路，但使用模拟支付

### 生产环境 (application-prod.yml)
- Mock模式：关闭
- 使用真实POS支付接口

## 配置参数

```yaml
pos:
  mock:
    enabled: true/false    # 是否启用mock模式
    success-rate: 95       # mock模式下的成功率（0-100）
    processing-delay: 3    # mock处理延迟（秒）
  provider:
    name: "REAL_POS_PROVIDER"
    api-url: "${POS_API_URL}"
    api-key: "${POS_API_KEY}"
    terminal-id: "${POS_TERMINAL_ID}"
```

## 环境变量

生产环境需要设置以下环境变量：
- `POS_API_URL`: POS提供商API地址
- `POS_API_KEY`: POS API密钥
- `POS_TERMINAL_ID`: POS终端ID

## 支付流程

1. 前端发起支付请求
2. 后端创建订单和POS交易记录
3. 调用POS客户端（Mock或真实）
4. 后端轮询支付状态
5. 支付完成后更新订单和预约状态

## Mock模式特性

- 模拟真实的支付处理延迟
- 可配置的成功/失败率
- 完整的状态轮询机制
- 生成模拟的授权码和卡号信息