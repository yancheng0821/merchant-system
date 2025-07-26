# 商户配置迁移说明

## 迁移内容

将 `MerchantConfig` 相关功能从 `business-service` 迁移到 `merchant-service`，解决数据库访问错误问题。

## 迁移的文件

### merchant-service 新增：
- `entity/MerchantConfig.java`
- `dto/MerchantConfigDTO.java`
- `mapper/MerchantConfigMapper.java`
- `service/MerchantConfigService.java`
- `service/impl/MerchantConfigServiceImpl.java`
- `controller/MerchantConfigController.java`
- `resources/mapper/MerchantConfigMapper.xml`

### business-service 删除：
- `entity/MerchantConfig.java`
- `dto/MerchantConfigDTO.java`
- `mapper/MerchantConfigMapper.java`
- `service/MerchantConfigService.java`
- `service/impl/MerchantConfigServiceImpl.java`
- `controller/MerchantConfigController.java`
- `client/MerchantConfigClient.java`

### 配置更新：
- `gateway-service/application.yml` - 将 `/api/merchant-config/**` 路由到 `merchant-service`
- `merchant-service/application.yml` - 添加 MyBatis 配置
- `merchant-service/pom.xml` - 添加 MyBatis 依赖

## 数据库连接

- `merchant-service` 连接 `merchant_management` 数据库（包含 merchants 和 merchant_settings 表）
- `business-service` 连接 `merchant_business` 数据库

## API 端点

现在所有商户配置相关的 API 都通过 `merchant-service` 提供：

- `GET /api/merchant-config/{tenantId}` - 获取商户完整配置
- `GET /api/merchant-config/{tenantId}/resource-types` - 获取资源类型配置
- `PUT /api/merchant-config/{tenantId}` - 更新商户配置
- `GET /api/merchant-config/{tenantId}/config/{configKey}` - 获取指定配置项
- `PUT /api/merchant-config/{tenantId}/config/{configKey}` - 更新指定配置项
- `GET /api/merchant-config/{tenantId}/all` - 获取所有配置项

## 测试

运行测试脚本：
```bash
./test-merchant-config.sh
```

## 启动顺序

1. 启动 `eureka-server`
2. 启动 `merchant-service`
3. 启动 `business-service`
4. 启动 `gateway-service`

## 注意事项

- 确保 `merchant_management` 数据库中有 `merchants` 和 `merchant_settings` 表
- Gateway 现在将 `/api/merchant-config/**` 路由到 `merchant-service`
- 如果前端或其他服务需要商户配置，应该调用 `merchant-service` 的 API