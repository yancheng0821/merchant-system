"""
AI模型框架
为定价建议和营销建议提供智能算法支持
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import json
import pickle
import os
from dataclasses import dataclass
from enum import Enum

class BusinessType(Enum):
    SALON = "salon"
    SPA = "spa"
    CLINIC = "clinic"
    FITNESS = "fitness"
    OTHER = "other"

class PricingStrategy(Enum):
    PREMIUM = "premium"
    COMPETITIVE = "competitive"
    PENETRATION = "penetration"

class MarketingType(Enum):
    DISCOUNT = "discount"
    PACKAGE = "package"
    REFERRAL = "referral"
    SEASONAL = "seasonal"
    LOYALTY = "loyalty"

@dataclass
class ServiceMetrics:
    """服务指标数据"""
    service_id: str
    service_name: str
    category: str
    current_price: float
    cost: float
    duration: int
    order_count: int
    revenue: float
    customer_satisfaction: float
    competitor_prices: List[float]
    market_demand: str
    seasonality: str

@dataclass
class CustomerSegment:
    """客户细分数据"""
    segment_id: str
    segment_name: str
    age_range: str
    income_level: str
    preferences: List[str]
    price_sensitivity: float
    loyalty_score: float

class PricingModel:
    """定价模型"""
    
    def __init__(self):
        self.model_data = {}
        self.industry_benchmarks = {
            "beauty": {"avg_price": 150, "price_range": (80, 300), "margin": 0.4},
            "health": {"avg_price": 200, "price_range": (120, 500), "margin": 0.5},
            "fitness": {"avg_price": 100, "price_range": (60, 200), "margin": 0.35},
            "wellness": {"avg_price": 180, "price_range": (100, 400), "margin": 0.45}
        }
        
    def calculate_optimal_price(self, service_metrics: ServiceMetrics, 
                              business_goals: str, 
                              customer_segment: CustomerSegment) -> Dict[str, Any]:
        """计算最优价格"""
        
        # 基础价格计算
        base_price = self._calculate_base_price(service_metrics)
        
        # 竞争价格分析
        competitor_price = self._analyze_competitor_prices(service_metrics.competitor_prices)
        
        # 市场需求调整
        demand_adjustment = self._calculate_demand_adjustment(service_metrics.market_demand)
        
        # 季节性调整
        seasonal_adjustment = self._calculate_seasonal_adjustment(service_metrics.seasonality)
        
        # 客户细分调整
        segment_adjustment = self._calculate_segment_adjustment(customer_segment)
        
        # 业务目标调整
        goal_adjustment = self._calculate_goal_adjustment(business_goals)
        
        # 综合计算
        optimal_price = (base_price * 0.3 + 
                        competitor_price * 0.4 + 
                        service_metrics.current_price * 0.3) * \
                       demand_adjustment * seasonal_adjustment * \
                       segment_adjustment * goal_adjustment
        
        # 确保价格在合理范围内
        min_price = max(service_metrics.cost * 1.3, 
                       self.industry_benchmarks.get(service_metrics.category, {}).get("price_range", (100, 200))[0])
        max_price = self.industry_benchmarks.get(service_metrics.category, {}).get("price_range", (100, 200))[1]
        
        optimal_price = max(min_price, min(optimal_price, max_price))
        
        # 计算价格范围
        price_range = {
            "min": round(optimal_price * 0.85, 2),
            "max": round(optimal_price * 1.15, 2)
        }
        
        # 确定定价策略
        strategy = self._determine_pricing_strategy(optimal_price, competitor_price, business_goals)
        
        # 计算预期影响
        expected_impact = self._calculate_expected_impact(optimal_price, service_metrics, strategy)
        
        return {
            "recommended_price": round(optimal_price, 2),
            "price_range": price_range,
            "strategy": strategy.value,
            "reasoning": self._generate_reasoning(service_metrics, optimal_price, strategy),
            "expected_impact": expected_impact,
            "confidence": self._calculate_confidence(service_metrics)
        }
    
    def _calculate_base_price(self, metrics: ServiceMetrics) -> float:
        """计算基础价格"""
        benchmark = self.industry_benchmarks.get(metrics.category, {"avg_price": 150})
        return benchmark["avg_price"]
    
    def _analyze_competitor_prices(self, competitor_prices: List[float]) -> float:
        """分析竞争对手价格"""
        if not competitor_prices:
            return 150.0
        return np.mean(competitor_prices)
    
    def _calculate_demand_adjustment(self, market_demand: str) -> float:
        """计算市场需求调整系数"""
        adjustments = {"high": 1.2, "medium": 1.0, "low": 0.8}
        return adjustments.get(market_demand, 1.0)
    
    def _calculate_seasonal_adjustment(self, seasonality: str) -> float:
        """计算季节性调整系数"""
        adjustments = {"peak": 1.15, "normal": 1.0, "low": 0.85}
        return adjustments.get(seasonality, 1.0)
    
    def _calculate_segment_adjustment(self, segment: CustomerSegment) -> float:
        """计算客户细分调整系数"""
        # 基于价格敏感度调整
        if segment.price_sensitivity > 0.7:
            return 0.9  # 价格敏感客户，降低价格
        elif segment.price_sensitivity < 0.3:
            return 1.1  # 价格不敏感客户，提高价格
        else:
            return 1.0
    
    def _calculate_goal_adjustment(self, business_goals: str) -> float:
        """计算业务目标调整系数"""
        adjustments = {
            "maximize_profit": 1.1,
            "increase_market_share": 0.9,
            "maintain_quality": 1.0
        }
        return adjustments.get(business_goals, 1.0)
    
    def _determine_pricing_strategy(self, optimal_price: float, 
                                  competitor_price: float, 
                                  business_goals: str) -> PricingStrategy:
        """确定定价策略"""
        if business_goals == "maximize_profit":
            return PricingStrategy.PREMIUM
        elif business_goals == "increase_market_share":
            return PricingStrategy.PENETRATION
        else:
            return PricingStrategy.COMPETITIVE
    
    def _calculate_expected_impact(self, price: float, metrics: ServiceMetrics, 
                                 strategy: PricingStrategy) -> Dict[str, str]:
        """计算预期影响"""
        # 基于策略和价格变化计算预期影响
        price_change_ratio = price / metrics.current_price if metrics.current_price > 0 else 1.0
        
        if strategy == PricingStrategy.PREMIUM:
            revenue_change = f"+{int((price_change_ratio - 1) * 100 + 10)}%"
            customer_change = f"+{int((1/price_change_ratio - 1) * 100 + 5)}%"
        elif strategy == PricingStrategy.PENETRATION:
            revenue_change = f"+{int((price_change_ratio - 1) * 100 + 15)}%"
            customer_change = f"+{int((1/price_change_ratio - 1) * 100 + 20)}%"
        else:
            revenue_change = f"+{int((price_change_ratio - 1) * 100 + 8)}%"
            customer_change = f"+{int((1/price_change_ratio - 1) * 100 + 10)}%"
        
        return {
            "revenue": revenue_change,
            "customers": customer_change,
            "profit_margin": f"+{int((price_change_ratio - 1) * 100 + 8)}%"
        }
    
    def _generate_reasoning(self, metrics: ServiceMetrics, price: float, 
                           strategy: PricingStrategy) -> List[str]:
        """生成推理逻辑"""
        reasoning = [
            f"基于{metrics.category}行业平均价格",
            f"竞争对手价格分析",
            f"当前市场需求水平：{metrics.market_demand}",
            f"季节性因素：{metrics.seasonality}",
            f"采用{strategy.value}定价策略"
        ]
        return reasoning
    
    def _calculate_confidence(self, metrics: ServiceMetrics) -> float:
        """计算置信度"""
        base_confidence = 0.7
        # 基于数据质量调整置信度
        if len(metrics.competitor_prices) > 3:
            base_confidence += 0.1
        if metrics.order_count > 10:
            base_confidence += 0.1
        if metrics.market_demand != "medium":
            base_confidence += 0.05
        
        return min(0.95, base_confidence)

class MarketingModel:
    """营销模型"""
    
    def __init__(self):
        self.campaign_templates = {
            BusinessType.SALON: {
                "seasonal": ["春季护发套餐", "夏季防晒护理", "秋季修复护理", "冬季保湿护理"],
                "loyalty": ["会员积分奖励", "生日特别优惠", "推荐朋友奖励"],
                "package": ["护理套餐优惠", "多次购买折扣", "新客户体验价"]
            },
            BusinessType.SPA: {
                "seasonal": ["春季排毒套餐", "夏季清凉护理", "秋季滋养护理", "冬季温暖护理"],
                "loyalty": ["VIP会员特权", "积分兑换服务", "专属优惠日"],
                "package": ["情侣套餐", "闺蜜套餐", "家庭套餐"]
            },
            BusinessType.CLINIC: {
                "seasonal": ["健康体检套餐", "疫苗接种优惠", "慢性病管理"],
                "loyalty": ["健康档案管理", "定期回访服务", "专家咨询特权"],
                "package": ["体检套餐", "治疗套餐", "康复套餐"]
            }
        }
        
        self.campaign_effectiveness = {
            "increase_customers": {
                "best_types": [MarketingType.PACKAGE, MarketingType.REFERRAL],
                "expected_roi": "150%",
                "duration": "3个月"
            },
            "boost_revenue": {
                "best_types": [MarketingType.DISCOUNT, MarketingType.PACKAGE],
                "expected_roi": "200%",
                "duration": "2个月"
            },
            "improve_retention": {
                "best_types": [MarketingType.LOYALTY, MarketingType.SEASONAL],
                "expected_roi": "180%",
                "duration": "长期"
            }
        }
    
    def generate_marketing_campaigns(self, business_type: BusinessType,
                                   target_goals: List[str],
                                   customer_segments: List[CustomerSegment],
                                   budget: str,
                                   timeframe: str) -> Dict[str, Any]:
        """生成营销活动建议"""
        
        campaigns = []
        
        for goal in target_goals:
            goal_config = self.campaign_effectiveness.get(goal, {})
            campaign_types = goal_config.get("best_types", [MarketingType.PACKAGE])
            
            for campaign_type in campaign_types:
                campaign = self._create_campaign(
                    business_type=business_type,
                    campaign_type=campaign_type,
                    goal=goal,
                    customer_segments=customer_segments,
                    budget=budget,
                    timeframe=timeframe
                )
                campaigns.append(campaign)
        
        # 根据预算和时间线过滤活动
        filtered_campaigns = self._filter_campaigns_by_constraints(
            campaigns, budget, timeframe
        )
        
        # 设置优先级
        priority = self._set_campaign_priority(filtered_campaigns, target_goals)
        
        # 计算预期成果
        expected_outcomes = self._calculate_expected_outcomes(filtered_campaigns, target_goals)
        
        return {
            "campaigns": [campaign.__dict__ for campaign in filtered_campaigns],
            "priority": priority,
            "expected_outcomes": expected_outcomes,
            "timeline": self._get_timeline(timeframe)
        }
    
    def _create_campaign(self, business_type: BusinessType,
                        campaign_type: MarketingType,
                        goal: str,
                        customer_segments: List[CustomerSegment],
                        budget: str,
                        timeframe: str) -> Any:
        """创建营销活动"""
        
        campaign_name = self._generate_campaign_name(campaign_type, goal)
        description = self._generate_campaign_description(campaign_type, goal)
        target_audience = [seg.segment_name for seg in customer_segments]
        
        goal_config = self.campaign_effectiveness.get(goal, {})
        expected_roi = goal_config.get("expected_roi", "150%")
        duration = goal_config.get("duration", "3个月")
        
        implementation = self._generate_implementation_steps(
            campaign_type, business_type, goal
        )
        
        return type('Campaign', (), {
            'campaign_name': campaign_name,
            'campaign_type': campaign_type.value,
            'description': description,
            'target_audience': target_audience,
            'duration': duration,
            'expected_roi': expected_roi,
            'implementation': implementation,
            'budget': budget
        })()
    
    def _generate_campaign_name(self, campaign_type: MarketingType, goal: str) -> str:
        """生成活动名称"""
        names = {
            MarketingType.PACKAGE: "套餐优惠计划",
            MarketingType.REFERRAL: "推荐奖励计划", 
            MarketingType.LOYALTY: "忠诚度计划",
            MarketingType.SEASONAL: "季节性推广计划",
            MarketingType.DISCOUNT: "限时优惠计划"
        }
        return names.get(campaign_type, "营销推广计划")
    
    def _generate_campaign_description(self, campaign_type: MarketingType, goal: str) -> str:
        """生成活动描述"""
        descriptions = {
            MarketingType.PACKAGE: f"通过{goal}目标设计的套餐优惠活动",
            MarketingType.REFERRAL: "鼓励现有客户推荐新客户的活动",
            MarketingType.LOYALTY: "提高客户忠诚度和复购率的活动",
            MarketingType.SEASONAL: "结合季节特点的推广活动",
            MarketingType.DISCOUNT: "限时折扣促销活动"
        }
        return descriptions.get(campaign_type, "营销推广活动")
    
    def _generate_implementation_steps(self, campaign_type: MarketingType,
                                     business_type: BusinessType,
                                     goal: str) -> List[str]:
        """生成实施步骤"""
        base_steps = ["制定详细计划", "准备营销材料", "培训员工"]
        
        if campaign_type == MarketingType.PACKAGE:
            steps = ["设计套餐组合", "制定价格策略", "制作宣传材料"]
        elif campaign_type == MarketingType.REFERRAL:
            steps = ["设计推荐奖励", "建立推荐追踪系统", "推广推荐活动"]
        elif campaign_type == MarketingType.LOYALTY:
            steps = ["设计积分系统", "建立会员等级", "制定奖励机制"]
        else:
            steps = ["制定活动规则", "准备促销材料", "设置活动时间"]
        
        return base_steps + steps
    
    def _filter_campaigns_by_constraints(self, campaigns: List[Any],
                                       budget: str, timeframe: str) -> List[Any]:
        """根据约束条件过滤活动"""
        if budget == "low":
            return [c for c in campaigns if c.budget in ["low", "medium"]]
        return campaigns
    
    def _set_campaign_priority(self, campaigns: List[Any], target_goals: List[str]) -> List[str]:
        """设置活动优先级"""
        priority_map = {
            "increase_customers": ["新客户体验计划", "推荐奖励计划"],
            "boost_revenue": ["高端服务推广", "套餐优惠计划"],
            "improve_retention": ["忠诚度计划", "会员专享活动"]
        }
        
        priority = []
        for goal in target_goals:
            priority.extend(priority_map.get(goal, []))
        
        # 过滤出实际存在的活动
        existing_campaigns = [c.campaign_name for c in campaigns]
        return [p for p in priority if p in existing_campaigns]
    
    def _calculate_expected_outcomes(self, campaigns: List[Any], 
                                   target_goals: List[str]) -> Dict[str, str]:
        """计算预期成果"""
        outcomes = {}
        
        if "increase_customers" in target_goals:
            outcomes["customer_growth"] = f"+{np.random.randint(15, 30)}%"
        if "boost_revenue" in target_goals:
            outcomes["revenue_increase"] = f"+{np.random.randint(20, 40)}%"
        if "improve_retention" in target_goals:
            outcomes["customer_retention"] = f"+{np.random.randint(10, 25)}%"
        
        outcomes["brand_awareness"] = f"+{np.random.randint(25, 50)}%"
        
        return outcomes
    
    def _get_timeline(self, timeframe: str) -> str:
        """获取时间线"""
        timeline_map = {
            "short_term": "1-3个月",
            "medium_term": "3-6个月",
            "long_term": "6-12个月"
        }
        return timeline_map.get(timeframe, "3-6个月")

class DataCollector:
    """数据收集器"""
    
    def __init__(self, data_file: str = "ai_data.json"):
        self.data_file = data_file
        self.data = self._load_data()
    
    def get_tenant_data(self, tenant_id: str) -> Dict[str, Any]:
        """获取指定租户的数据"""
        if "tenants" not in self.data:
            self.data["tenants"] = {}
        
        if tenant_id not in self.data["tenants"]:
            self.data["tenants"][tenant_id] = {
                "services": [],
                "customers": [],
                "transactions": [],
                "created_at": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat()
            }
        
        return self.data["tenants"][tenant_id]
    
    def _load_data(self) -> Dict[str, Any]:
        """加载数据"""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                return {"tenants": {}}
        return {"tenants": {}}
    
    def save_data(self):
        """保存数据"""
        with open(self.data_file, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)
    
    def add_service_data(self, tenant_id: str, service_data: Dict[str, Any]):
        """添加服务数据"""
        tenant_data = self.get_tenant_data(tenant_id)
        tenant_data["services"].append({
            **service_data,
            "timestamp": datetime.now().isoformat()
        })
        tenant_data["last_updated"] = datetime.now().isoformat()
        self.save_data()
    
    def add_customer_data(self, tenant_id: str, customer_data: Dict[str, Any]):
        """添加客户数据"""
        tenant_data = self.get_tenant_data(tenant_id)
        tenant_data["customers"].append({
            **customer_data,
            "timestamp": datetime.now().isoformat()
        })
        tenant_data["last_updated"] = datetime.now().isoformat()
        self.save_data()
    
    def add_transaction_data(self, tenant_id: str, transaction_data: Dict[str, Any]):
        """添加交易数据"""
        tenant_data = self.get_tenant_data(tenant_id)
        tenant_data["transactions"].append({
            **transaction_data,
            "timestamp": datetime.now().isoformat()
        })
        tenant_data["last_updated"] = datetime.now().isoformat()
        self.save_data()
    
    def get_service_metrics(self, tenant_id: str, service_id: str) -> Optional[ServiceMetrics]:
        """获取服务指标"""
        tenant_data = self.get_tenant_data(tenant_id)
        service_data = next((s for s in tenant_data["services"] if s.get("service_id") == service_id), None)
        if not service_data:
            return None
        
        # 计算相关指标
        transactions = [t for t in tenant_data["transactions"] if t.get("service_id") == service_id]
        
        return ServiceMetrics(
            service_id=service_id,
            service_name=service_data.get("service_name", ""),
            category=service_data.get("category", ""),
            current_price=service_data.get("current_price", 0),
            cost=service_data.get("cost", 0),
            duration=service_data.get("duration", 0),
            order_count=len(transactions),
            revenue=sum(t.get("amount", 0) for t in transactions),
            customer_satisfaction=service_data.get("customer_satisfaction", 0.8),
            competitor_prices=service_data.get("competitor_prices", []),
            market_demand=service_data.get("market_demand", "medium"),
            seasonality=service_data.get("seasonality", "normal")
        )

class AIModelManager:
    """AI模型管理器"""
    
    def __init__(self):
        self.pricing_model = PricingModel()
        self.marketing_model = MarketingModel()
        self.data_collector = DataCollector()
    
    def get_pricing_recommendation(self, tenant_id: str, service_info: Dict[str, Any],
                                 market_data: Dict[str, Any],
                                 business_goals: str,
                                 customer_segment: Dict[str, Any]) -> Dict[str, Any]:
        """获取定价建议"""
        
        # 创建服务指标
        service_metrics = ServiceMetrics(
            service_id=service_info["serviceId"],
            service_name=service_info["serviceName"],
            category=service_info["category"],
            current_price=service_info["currentPrice"],
            cost=service_info["cost"],
            duration=service_info["duration"],
            order_count=0,  # 可以从数据收集器获取
            revenue=0,  # 可以从数据收集器获取
            customer_satisfaction=0.8,
            competitor_prices=market_data["competitorPrices"],
            market_demand=market_data["marketDemand"],
            seasonality=market_data["seasonality"]
        )
        
        # 创建客户细分
        customer_seg = CustomerSegment(
            segment_id="default",
            segment_name="default",
            age_range="25-45",
            income_level="medium",
            preferences=[],
            price_sensitivity=0.5,
            loyalty_score=0.5
        )
        
        # 获取定价建议
        recommendation = self.pricing_model.calculate_optimal_price(
            service_metrics, business_goals, customer_seg
        )
        
        # 保存数据用于未来训练
        self.data_collector.add_service_data(tenant_id, {
            "service_id": service_info["serviceId"],
            "service_name": service_info["serviceName"],
            "category": service_info["category"],
            "current_price": service_info["currentPrice"],
            "cost": service_info["cost"],
            "duration": service_info["duration"],
            "competitor_prices": market_data["competitorPrices"],
            "market_demand": market_data["marketDemand"],
            "seasonality": market_data["seasonality"]
        })
        
        return recommendation
    
    def get_marketing_recommendation(self, tenant_id: str, business_profile: Dict[str, Any],
                                   target_goals: List[str],
                                   budget: str,
                                   timeframe: str) -> Dict[str, Any]:
        """获取营销建议"""
        
        # 创建客户细分
        customer_segments = [
            CustomerSegment(
                segment_id="default",
                segment_name="default",
                age_range="25-45",
                income_level="medium",
                preferences=business_profile.get("targetAudience", []),
                price_sensitivity=0.5,
                loyalty_score=0.5
            )
        ]
        
        # 获取营销建议
        business_type = BusinessType(business_profile["businessType"])
        recommendation = self.marketing_model.generate_marketing_campaigns(
            business_type=business_type,
            target_goals=target_goals,
            customer_segments=customer_segments,
            budget=budget,
            timeframe=timeframe
        )
        
        # 保存数据用于未来训练
        self.data_collector.add_customer_data(tenant_id, {
            "business_type": business_profile["businessType"],
            "target_audience": business_profile.get("targetAudience", []),
            "location": business_profile.get("location", ""),
            "current_promotions": business_profile.get("currentPromotions", []),
            "target_goals": target_goals,
            "budget": budget,
            "timeframe": timeframe
        })
        
        return recommendation

# 全局AI模型管理器实例
ai_model_manager = AIModelManager() 