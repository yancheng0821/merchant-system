from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import random
from datetime import datetime, timedelta
import uvicorn

app = FastAPI(title="AI Service", description="智能预约推荐和需求预测服务", version="1.0.0")

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制为特定域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 请求模型
class CustomerOrder(BaseModel):
    orderId: str
    serviceId: str
    serviceName: str
    orderDate: str
    amount: float
    status: str

class CustomerHistoryDto(BaseModel):
    customerId: str
    customerName: str
    orders: List[CustomerOrder]

class OrderDto(BaseModel):
    orderId: str
    serviceId: str
    serviceName: str
    orderDate: str
    amount: float
    status: str

# 响应模型
class AppointmentRecommendation(BaseModel):
    serviceId: str
    serviceName: str
    recommendedDate: str
    recommendedTime: str
    confidence: float
    reason: str

class ServiceDemandPrediction(BaseModel):
    serviceId: str
    serviceName: str
    predictedOrders: int
    confidence: float

# ApiResponse 类已移除，直接返回字典格式

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/ai/recommend-appointment")
async def recommend_appointment(request: CustomerHistoryDto):
    """根据客户历史订单推荐预约"""
    try:
        # 模拟智能推荐逻辑
        recommendations = []
        
        if not request.orders:
            return {
                "success": True,
                "message": "无历史订单，返回热门服务推荐",
                "data": []
            }
        
        # 分析客户偏好的服务
        service_frequency = {}
        for order in request.orders:
            service_frequency[order.serviceId] = service_frequency.get(order.serviceId, 0) + 1
        
        # 生成推荐
        for service_id, frequency in service_frequency.items():
            service_name = next((order.serviceName for order in request.orders if order.serviceId == service_id), f"Service {service_id}")
            
            # 模拟推荐时间（未来3-7天）
            recommended_date = (datetime.now() + timedelta(days=random.randint(3, 7))).strftime("%Y-%m-%d")
            recommended_time = f"{random.randint(9, 17):02d}:00"
            
            confidence = min(0.9, 0.5 + (frequency * 0.1))
            
            recommendations.append(AppointmentRecommendation(
                serviceId=service_id,
                serviceName=service_name,
                recommendedDate=recommended_date,
                recommendedTime=recommended_time,
                confidence=confidence,
                reason=f"基于您过去{frequency}次使用该服务的历史"
            ))
        
        # 按置信度排序
        recommendations.sort(key=lambda x: x.confidence, reverse=True)
        
        return {
            "success": True,
            "message": "预约推荐生成成功",
            "data": [rec.model_dump() for rec in recommendations[:3]]  # 返回前3个推荐
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"推荐生成失败: {str(e)}")

@app.post("/api/ai/predict-demand")
async def predict_demand(orders: List[OrderDto]):
    """根据最近30天订单数据预测未来7天需求"""
    try:
        # 模拟需求预测逻辑
        if not orders:
            return {
                "success": True,
                "message": "无订单数据，无法预测",
                "data": []
            }
        
        # 统计各服务的订单量
        service_stats = {}
        for order in orders:
            if order.serviceId not in service_stats:
                service_stats[order.serviceId] = {
                    'serviceName': order.serviceName,
                    'totalOrders': 0
                }
            service_stats[order.serviceId]['totalOrders'] += 1
        
        # 生成预测
        predictions = []
        for service_id, stats in service_stats.items():
            # 简单预测：基于历史平均值加上随机波动
            daily_avg = stats['totalOrders'] / 30  # 30天平均
            predicted_weekly = int(daily_avg * 7 * (0.8 + random.random() * 0.4))  # ±20%波动
            
            confidence = min(0.95, 0.6 + (stats['totalOrders'] * 0.01))
            
            predictions.append(ServiceDemandPrediction(
                serviceId=service_id,
                serviceName=stats['serviceName'],
                predictedOrders=max(1, predicted_weekly),
                confidence=confidence
            ))
        
        # 按预测订单量排序
        predictions.sort(key=lambda x: x.predictedOrders, reverse=True)
        
        return {
            "success": True,
            "message": "需求预测生成成功", 
            "data": [pred.model_dump() for pred in predictions]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"需求预测失败: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    uvicorn.run(app, host="0.0.0.0", port=port)