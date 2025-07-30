# AI 微服务

基于 Python + FastAPI 的智能预约推荐和需求预测服务。

## 功能特性

1. **预约推荐** (`/recommend_appointment`)
   - 根据客户历史订单数据提供智能预约推荐
   - 分析客户偏好和使用频率
   - 返回推荐服务、时间和置信度

2. **需求预测** (`/predict_demand`)
   - 基于最近30天订单数据预测未来7天服务需求
   - 预测各服务的订单量
   - 提供预测置信度

## 快速开始

### 本地运行

1. 安装依赖：
```bash
pip install -r requirements.txt
```

2. 启动服务：
```bash
python main.py
```

服务将在 `http://localhost:5000` 启动。

### Docker 运行

1. 构建镜像：
```bash
docker build -t ai-service-python .
```

2. 运行容器：
```bash
docker run -p 5000:5000 ai-service-python
```

### Kubernetes 部署

```bash
kubectl apply -f k8s-deployment.yaml
```

## API 文档

### 健康检查
```
GET /health
```

### 预约推荐
```
POST /recommend_appointment
Content-Type: application/json

{
  "customerId": "CUST001",
  "customerName": "张三",
  "orders": [
    {
      "orderId": "ORD001",
      "serviceId": "SRV001",
      "serviceName": "理发服务",
      "orderDate": "2024-01-15",
      "amount": 50.0,
      "status": "completed"
    }
  ]
}
```

### 需求预测
```
POST /predict_demand
Content-Type: application/json

[
  {
    "orderId": "ORD001",
    "serviceId": "SRV001",
    "serviceName": "理发服务",
    "orderDate": "2024-01-15",
    "amount": 50.0,
    "status": "completed"
  }
]
```

## 测试

运行测试脚本：
```bash
python test_service.py
```

## 环境变量

- `PORT`: 服务端口，默认 5000

## Spring Boot 集成

在 Spring Boot 微服务中通过以下方式调用：

```java
@Autowired
private AiService aiService;

// 获取预约推荐
Result<List<AppointmentRecommendationDto>> recommendations = 
    aiService.getAppointmentRecommendation(customerHistory);

// 预测服务需求
Result<List<ServiceDemandPredictionDto>> predictions = 
    aiService.predictServiceDemand(orders);
```

## 注意事项

- 当前使用模拟逻辑返回数据，可根据需要替换为真实的 AI 算法
- 服务支持水平扩展，可在 K8s 中调整副本数
- 建议在生产环境中配置适当的资源限制和监控