# AI服务 - 智能业务洞察

## 概述

AI服务为商户管理系统提供智能化的业务洞察和建议，包括需求预测、定价建议、营销建议和市场洞察等功能。

## 功能特性

### 1. 需求预测 (`/api/ai/predict-demand`)
- 基于历史订单数据预测未来7天各服务的需求
- 提供置信度评估
- 支持多租户数据隔离

### 2. 定价建议 (`/api/ai/pricing-recommendation`)
- 智能定价策略建议
- 考虑竞争对手价格、市场需求、季节性等因素
- 提供价格范围和预期影响分析
- 支持多种业务目标（最大化利润、增加市场份额、保持质量）

### 3. 营销建议 (`/api/ai/marketing-recommendation`)
- 个性化营销活动建议
- 基于业务类型、目标受众、预算等因素
- 提供活动类型、预期ROI、实施步骤等详细信息
- 支持多种营销目标（增加客户、提升收入、改善留存）

### 4. 市场洞察 (`/api/ai/market-insights`)
- 行业趋势分析
- 客户偏好洞察
- 定价趋势分析
- 营销渠道效果评估

## API接口

### 健康检查
```http
GET /health
```

### 需求预测
```http
POST /api/ai/predict-demand
Content-Type: application/json

{
  "tenantId": "tenant_001",
  "orders": [
    {
      "orderId": "ORD001",
      "serviceId": "SRV001",
      "serviceName": "理发服务",
      "orderDate": "2024-01-01",
      "amount": 50.0,
      "status": "completed"
    }
  ]
}
```

### 定价建议
```http
POST /api/ai/pricing-recommendation
Content-Type: application/json

{
  "tenantId": "tenant_001",
  "serviceInfo": {
    "serviceId": "SRV001",
    "serviceName": "理发服务",
    "currentPrice": 100.0,
    "category": "beauty",
    "duration": 60,
    "cost": 40.0
  },
  "marketData": {
    "competitorPrices": [90.0, 110.0, 95.0],
    "marketDemand": "high",
    "seasonality": "peak",
    "customerSegment": "standard"
  },
  "businessGoals": "maximize_profit"
}
```

### 营销建议
```http
POST /api/ai/marketing-recommendation
Content-Type: application/json

{
  "tenantId": "tenant_001",
  "businessProfile": {
    "businessType": "salon",
    "targetAudience": ["young_professionals", "students"],
    "location": "urban",
    "currentPromotions": ["新客户优惠", "会员折扣"]
  },
  "targetGoals": ["increase_customers", "boost_revenue"],
  "budget": "medium",
  "timeframe": "medium_term"
}
```

### 市场洞察
```http
GET /api/ai/market-insights
```

## 部署

### 本地开发
```bash
# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py
```

### Docker部署
```bash
# 构建镜像
docker build -t ai-service-python .

# 运行容器
docker run -p 5000:5000 ai-service-python
```

### Kubernetes部署
```bash
# 应用K8s配置
kubectl apply -f k8s-deployment/ai-service.yaml
```

## 测试

运行测试脚本验证服务功能：
```bash
python test_ai_service.py
```

## 前端集成

前端已集成以下功能：
1. **需求预测展示** - 在Analytics模块的AI业务洞察标签页
2. **定价建议获取** - 通过对话框输入服务信息获取建议
3. **营销建议获取** - 通过对话框输入业务信息获取建议
4. **市场洞察展示** - 显示行业趋势和客户偏好

### 前端API调用示例

```typescript
// 获取定价建议
const pricingResult = await aiApi.getPricingRecommendation(
  tenantId,
  serviceInfo,
  marketData,
  businessGoals
);

// 获取营销建议
const marketingResult = await aiApi.getMarketingRecommendation(
  tenantId,
  businessProfile,
  targetGoals,
  budget,
  timeframe
);
```

## 数据模型

### 定价建议响应
```typescript
interface PricingRecommendation {
  recommendedPrice: number;
  priceRange: { min: number; max: number };
  strategy: string;
  reasoning: string[];
  expectedImpact: { revenue: string; customers: string; profit_margin: string };
  confidence: number;
}
```

### 营销建议响应
```typescript
interface MarketingRecommendation {
  campaigns: MarketingCampaign[];
  priority: string[];
  expectedOutcomes: { [key: string]: string };
  timeline: string;
}
```

## 配置说明

### 环境变量
- `PORT`: 服务端口（默认5000）
- `LOG_LEVEL`: 日志级别（默认INFO）

### 数据存储
- 使用JSON文件存储AI分析数据
- 支持多租户数据隔离
- 自动保存分析结果用于模型训练

## 注意事项

1. **数据隐私**: 所有分析数据仅存储在本地，不会上传到外部服务
2. **模型准确性**: AI建议仅供参考，实际业务决策请结合具体情况
3. **性能优化**: 建议在生产环境中配置适当的资源限制
4. **错误处理**: 服务包含完善的错误处理机制，确保稳定性

## 更新日志

### v1.2.1
- 新增定价建议功能
- 新增营销建议功能
- 优化需求预测算法
- 改进前端集成体验

### v1.2.0
- 新增市场洞察功能
- 优化AI模型性能
- 改进数据收集机制

### v1.1.0
- 新增需求预测功能
- 基础AI服务框架