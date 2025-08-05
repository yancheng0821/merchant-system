from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import random
from datetime import datetime, timedelta
import uvicorn
import json
from ai_models import ai_model_manager

app = FastAPI(title="AI Service", description="智能需求预测、定价建议和营销建议服务", version="1.0.0")

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制为特定域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 请求模型
class OrderDto(BaseModel):
    orderId: str
    serviceId: str
    serviceName: str
    orderDate: str
    amount: float
    status: str

class DemandPredictionRequest(BaseModel):
    tenantId: str  # 租户ID
    orders: List[OrderDto]

# 新增：定价相关模型
class ServiceInfo(BaseModel):
    serviceId: str
    serviceName: str
    currentPrice: float
    category: str
    duration: int  # 服务时长（分钟）
    cost: float  # 成本

class MarketData(BaseModel):
    competitorPrices: List[float]
    marketDemand: str  # "high", "medium", "low"
    seasonality: str  # "peak", "normal", "low"
    customerSegment: str  # "premium", "standard", "budget"

class PricingRequest(BaseModel):
    tenantId: str  # 租户ID
    serviceInfo: ServiceInfo
    marketData: MarketData
    businessGoals: str  # "maximize_profit", "increase_market_share", "maintain_quality"

# 新增：营销相关模型
class BusinessProfile(BaseModel):
    businessType: str  # "salon", "spa", "clinic", "fitness", "other"
    targetAudience: List[str]  # ["young_professionals", "students", "families", "seniors"]
    location: str  # "urban", "suburban", "rural"
    currentPromotions: List[str]

class MarketingRequest(BaseModel):
    tenantId: str  # 租户ID
    businessProfile: BusinessProfile
    targetGoals: List[str]  # ["increase_customers", "boost_revenue", "improve_retention", "launch_new_service"]
    budget: str  # "low", "medium", "high"
    timeframe: str  # "short_term", "medium_term", "long_term"

# 响应模型
class ServiceDemandPrediction(BaseModel):
    serviceId: str
    serviceName: str
    predictedOrders: int
    confidence: float

# 新增：定价建议响应模型
class PricingRecommendation(BaseModel):
    recommendedPrice: float
    priceRange: Dict[str, float]  # {"min": 100, "max": 150}
    strategy: str  # "premium", "competitive", "penetration"
    reasoning: List[str]
    expectedImpact: Dict[str, str]  # {"revenue": "+15%", "customers": "+10%"}
    confidence: float

# 新增：营销建议响应模型
class MarketingCampaign(BaseModel):
    campaignName: str
    campaignType: str  # "discount", "package", "referral", "seasonal", "loyalty"
    description: str
    targetAudience: List[str]
    duration: str
    expectedROI: str
    implementation: List[str]
    budget: str

class MarketingRecommendation(BaseModel):
    campaigns: List[MarketingCampaign]
    priority: List[str]  # 优先级排序
    expectedOutcomes: Dict[str, str]
    timeline: str

# 模拟数据存储
class MockDataStore:
    def __init__(self):
        self.service_categories = {
            "beauty": {"avg_price": 150, "price_range": (80, 300)},
            "health": {"avg_price": 200, "price_range": (120, 500)},
            "fitness": {"avg_price": 100, "price_range": (60, 200)},
            "wellness": {"avg_price": 180, "price_range": (100, 400)}
        }
        
        self.marketing_templates = {
            "salon": {
                "seasonal": ["春季护发套餐", "夏季防晒护理", "秋季修复护理", "冬季保湿护理"],
                "loyalty": ["会员积分奖励", "生日特别优惠", "推荐朋友奖励"],
                "package": ["护理套餐优惠", "多次购买折扣", "新客户体验价"]
            },
            "spa": {
                "seasonal": ["春季排毒套餐", "夏季清凉护理", "秋季滋养护理", "冬季温暖护理"],
                "loyalty": ["VIP会员特权", "积分兑换服务", "专属优惠日"],
                "package": ["情侣套餐", "闺蜜套餐", "家庭套餐"]
            },
            "clinic": {
                "seasonal": ["健康体检套餐", "疫苗接种优惠", "慢性病管理"],
                "loyalty": ["健康档案管理", "定期回访服务", "专家咨询特权"],
                "package": ["体检套餐", "治疗套餐", "康复套餐"]
            }
        }

# 全局数据存储实例
data_store = MockDataStore()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}



@app.post("/api/ai/predict-demand")
async def predict_demand(request: DemandPredictionRequest):
    """根据最近30天订单数据预测未来7天需求"""
    try:
        tenant_id = request.tenantId
        orders = request.orders
        
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
            "data": [pred.dict() for pred in predictions]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"需求预测失败: {str(e)}")

@app.post("/api/ai/pricing-recommendation")
async def get_pricing_recommendation(request: PricingRequest):
    """智能定价建议"""
    try:
        tenant_id = request.tenantId
        service_info = request.serviceInfo
        market_data = request.marketData
        business_goals = request.businessGoals
        
        # 使用AI模型管理器获取定价建议
        recommendation_data = ai_model_manager.get_pricing_recommendation(
            tenant_id=tenant_id,
            service_info=service_info.dict(),
            market_data=market_data.dict(),
            business_goals=business_goals,
            customer_segment={"price_sensitivity": 0.5, "loyalty_score": 0.5}
        )
        
        recommendation = PricingRecommendation(
            recommendedPrice=recommendation_data["recommended_price"],
            priceRange=recommendation_data["price_range"],
            strategy=recommendation_data["strategy"],
            reasoning=recommendation_data["reasoning"],
            expectedImpact=recommendation_data["expected_impact"],
            confidence=recommendation_data["confidence"]
        )
        
        return {
            "success": True,
            "message": "定价建议生成成功",
            "data": recommendation.dict()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"定价建议生成失败: {str(e)}")

@app.post("/api/ai/marketing-recommendation")
async def get_marketing_recommendation(request: MarketingRequest):
    """智能营销建议"""
    try:
        tenant_id = request.tenantId
        business_profile = request.businessProfile
        target_goals = request.targetGoals
        budget = request.budget
        timeframe = request.timeframe
        
        # 使用AI模型管理器获取营销建议
        recommendation_data = ai_model_manager.get_marketing_recommendation(
            tenant_id=tenant_id,
            business_profile=business_profile.dict(),
            target_goals=target_goals,
            budget=budget,
            timeframe=timeframe
        )
        
        # 转换活动数据格式
        campaigns = []
        for campaign_data in recommendation_data["campaigns"]:
            campaign = MarketingCampaign(
                campaignName=campaign_data.get("campaign_name", "营销活动"),
                campaignType=campaign_data.get("campaign_type", "package"),
                description=campaign_data.get("description", "营销推广活动"),
                targetAudience=campaign_data.get("target_audience", []),
                duration=campaign_data.get("duration", "3个月"),
                expectedROI=campaign_data.get("expected_roi", "150%"),
                implementation=campaign_data.get("implementation", []),
                budget=campaign_data.get("budget", "medium")
            )
            campaigns.append(campaign)
        
        recommendation = MarketingRecommendation(
            campaigns=[c.dict() for c in campaigns],
            priority=recommendation_data["priority"],
            expectedOutcomes=recommendation_data["expected_outcomes"],
            timeline=recommendation_data["timeline"]
        )
        
        return {
            "success": True,
            "message": "营销建议生成成功",
            "data": recommendation.dict()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"营销建议生成失败: {str(e)}")

@app.get("/api/ai/market-insights")
async def get_market_insights():
    """获取市场洞察数据"""
    try:
        # 模拟市场洞察数据
        insights = {
            "trending_services": [
                {"name": "智能美容护理", "growth": "+25%", "demand": "high"},
                {"name": "健康管理咨询", "growth": "+18%", "demand": "medium"},
                {"name": "个性化健身计划", "growth": "+22%", "demand": "high"}
            ],
            "customer_preferences": {
                "age_groups": {
                    "18-25": "注重性价比和便利性",
                    "26-35": "追求品质和个性化",
                    "36-50": "重视专业性和效果",
                    "50+": "关注健康和安全"
                },
                "popular_times": {
                    "weekdays": "18:00-20:00",
                    "weekends": "10:00-12:00, 14:00-16:00"
                }
            },
            "pricing_trends": {
                "average_increase": "+8.5%",
                "premium_services": "+15%",
                "budget_services": "+5%"
            },
            "marketing_channels": {
                "most_effective": ["社交媒体", "口碑推荐", "搜索引擎"],
                "emerging": ["短视频平台", "直播营销", "私域流量"]
            }
        }
        
        return {
            "success": True,
            "message": "市场洞察数据获取成功",
            "data": insights
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"市场洞察获取失败: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)