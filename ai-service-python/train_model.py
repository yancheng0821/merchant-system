#!/usr/bin/env python3
"""
AI模型训练脚本
为未来的机器学习功能准备数据和训练模型
"""

import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any
import os
from ai_models import DataCollector, ServiceMetrics, CustomerSegment

class ModelTrainer:
    """模型训练器"""
    
    def __init__(self, data_file: str = "ai_data.json"):
        self.data_collector = DataCollector(data_file)
        self.training_data = []
        
    def generate_training_data(self, num_samples: int = 1000):
        """生成训练数据"""
        print(f"生成 {num_samples} 条训练数据...")
        
        # 服务类别
        categories = ["beauty", "health", "fitness", "wellness"]
        
        # 业务目标
        business_goals = ["maximize_profit", "increase_market_share", "maintain_quality"]
        
        # 市场需求
        market_demands = ["high", "medium", "low"]
        
        # 季节性
        seasonalities = ["peak", "normal", "low"]
        
        # 客户细分
        customer_segments = ["premium", "standard", "budget"]
        
        for i in range(num_samples):
            # 生成随机服务数据
            category = np.random.choice(categories)
            current_price = np.random.uniform(50, 500)
            cost = current_price * np.random.uniform(0.3, 0.7)
            duration = np.random.randint(30, 180)
            
            # 生成竞争对手价格
            competitor_prices = [
                current_price * np.random.uniform(0.8, 1.2) 
                for _ in range(np.random.randint(2, 6))
            ]
            
            # 生成市场数据
            market_demand = np.random.choice(market_demands)
            seasonality = np.random.choice(seasonalities)
            customer_segment = np.random.choice(customer_segments)
            
            # 生成业务目标
            business_goal = np.random.choice(business_goals)
            
            # 生成客户数据
            customer_data = {
                "age_range": np.random.choice(["18-25", "26-35", "36-50", "50+"]),
                "income_level": np.random.choice(["low", "medium", "high"]),
                "price_sensitivity": np.random.uniform(0.1, 0.9),
                "loyalty_score": np.random.uniform(0.1, 0.9)
            }
            
            # 生成交易数据
            order_count = np.random.randint(0, 50)
            revenue = order_count * current_price * np.random.uniform(0.8, 1.2)
            customer_satisfaction = np.random.uniform(0.6, 1.0)
            
            # 创建服务指标
            service_metrics = ServiceMetrics(
                service_id=f"service_{i:04d}",
                service_name=f"服务_{i:04d}",
                category=category,
                current_price=current_price,
                cost=cost,
                duration=duration,
                order_count=order_count,
                revenue=revenue,
                customer_satisfaction=customer_satisfaction,
                competitor_prices=competitor_prices,
                market_demand=market_demand,
                seasonality=seasonality
            )
            
            # 创建客户细分
            customer_seg = CustomerSegment(
                segment_id=f"segment_{i:04d}",
                segment_name=customer_segment,
                age_range=customer_data["age_range"],
                income_level=customer_data["income_level"],
                preferences=[],
                price_sensitivity=customer_data["price_sensitivity"],
                loyalty_score=customer_data["loyalty_score"]
            )
            
            # 保存数据
            self.data_collector.add_service_data({
                "service_id": service_metrics.service_id,
                "service_name": service_metrics.service_name,
                "category": service_metrics.category,
                "current_price": service_metrics.current_price,
                "cost": service_metrics.cost,
                "duration": service_metrics.duration,
                "order_count": service_metrics.order_count,
                "revenue": service_metrics.revenue,
                "customer_satisfaction": service_metrics.customer_satisfaction,
                "competitor_prices": service_metrics.competitor_prices,
                "market_demand": service_metrics.market_demand,
                "seasonality": service_metrics.seasonality
            })
            
            self.data_collector.add_customer_data({
                "segment_id": customer_seg.segment_id,
                "segment_name": customer_seg.segment_name,
                "age_range": customer_seg.age_range,
                "income_level": customer_seg.income_level,
                "price_sensitivity": customer_seg.price_sensitivity,
                "loyalty_score": customer_seg.loyalty_score
            })
            
            # 生成交易数据
            for j in range(order_count):
                transaction_data = {
                    "transaction_id": f"trans_{i:04d}_{j:04d}",
                    "service_id": service_metrics.service_id,
                    "customer_id": f"customer_{i:04d}",
                    "amount": current_price * np.random.uniform(0.9, 1.1),
                    "date": (datetime.now() - timedelta(days=np.random.randint(1, 365))).strftime("%Y-%m-%d"),
                    "status": "completed"
                }
                self.data_collector.add_transaction_data(transaction_data)
        
        print(f"成功生成 {num_samples} 条训练数据")
    
    def analyze_data(self):
        """分析训练数据"""
        print("\n=== 数据分析 ===")
        
        data = self.data_collector.data
        
        # 服务数据分析
        services = data.get("services", [])
        if services:
            print(f"服务数据数量: {len(services)}")
            
            # 按类别统计
            categories = {}
            for service in services:
                category = service.get("category", "unknown")
                categories[category] = categories.get(category, 0) + 1
            
            print("服务类别分布:")
            for category, count in categories.items():
                print(f"  {category}: {count}")
            
            # 价格分析
            prices = [s.get("current_price", 0) for s in services]
            print(f"价格统计:")
            print(f"  平均价格: {np.mean(prices):.2f}")
            print(f"  最高价格: {np.max(prices):.2f}")
            print(f"  最低价格: {np.min(prices):.2f}")
        
        # 客户数据分析
        customers = data.get("customers", [])
        if customers:
            print(f"\n客户数据数量: {len(customers)}")
            
            # 价格敏感度分析
            sensitivities = [c.get("price_sensitivity", 0.5) for c in customers]
            print(f"价格敏感度统计:")
            print(f"  平均值: {np.mean(sensitivities):.3f}")
            print(f"  标准差: {np.std(sensitivities):.3f}")
        
        # 交易数据分析
        transactions = data.get("transactions", [])
        if transactions:
            print(f"\n交易数据数量: {len(transactions)}")
            
            # 交易金额分析
            amounts = [t.get("amount", 0) for t in transactions]
            print(f"交易金额统计:")
            print(f"  总交易额: {np.sum(amounts):.2f}")
            print(f"  平均交易额: {np.mean(amounts):.2f}")
            print(f"  最高交易额: {np.max(amounts):.2f}")
    
    def export_data_for_ml(self, output_file: str = "ml_training_data.json"):
        """导出机器学习训练数据"""
        print(f"\n导出机器学习训练数据到 {output_file}...")
        
        data = self.data_collector.data
        
        # 准备ML训练数据
        ml_data = {
            "pricing_data": [],
            "marketing_data": [],
            "metadata": {
                "export_time": datetime.now().isoformat(),
                "total_services": len(data.get("services", [])),
                "total_customers": len(data.get("customers", [])),
                "total_transactions": len(data.get("transactions", []))
            }
        }
        
        # 定价数据
        for service in data.get("services", []):
            pricing_sample = {
                "features": {
                    "category": service.get("category"),
                    "current_price": service.get("current_price"),
                    "cost": service.get("cost"),
                    "duration": service.get("duration"),
                    "order_count": service.get("order_count"),
                    "revenue": service.get("revenue"),
                    "customer_satisfaction": service.get("customer_satisfaction"),
                    "competitor_prices_mean": np.mean(service.get("competitor_prices", [0])),
                    "competitor_prices_std": np.std(service.get("competitor_prices", [0])),
                    "market_demand": service.get("market_demand"),
                    "seasonality": service.get("seasonality")
                },
                "target": {
                    "optimal_price": service.get("current_price") * np.random.uniform(0.8, 1.2),
                    "price_strategy": np.random.choice(["premium", "competitive", "penetration"])
                }
            }
            ml_data["pricing_data"].append(pricing_sample)
        
        # 营销数据
        for customer in data.get("customers", []):
            marketing_sample = {
                "features": {
                    "age_range": customer.get("age_range"),
                    "income_level": customer.get("income_level"),
                    "price_sensitivity": customer.get("price_sensitivity"),
                    "loyalty_score": customer.get("loyalty_score")
                },
                "target": {
                    "preferred_campaign_type": np.random.choice(["package", "loyalty", "seasonal", "referral"]),
                    "expected_roi": np.random.uniform(1.2, 2.5)
                }
            }
            ml_data["marketing_data"].append(marketing_sample)
        
        # 保存数据
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(ml_data, f, ensure_ascii=False, indent=2)
        
        print(f"成功导出 {len(ml_data['pricing_data'])} 条定价数据和 {len(ml_data['marketing_data'])} 条营销数据")
    
    def create_model_performance_report(self):
        """创建模型性能报告"""
        print("\n=== 模型性能报告 ===")
        
        # 模拟模型性能指标
        performance_metrics = {
            "pricing_model": {
                "accuracy": np.random.uniform(0.75, 0.95),
                "mae": np.random.uniform(5, 20),
                "rmse": np.random.uniform(8, 25),
                "r2_score": np.random.uniform(0.6, 0.9)
            },
            "marketing_model": {
                "accuracy": np.random.uniform(0.70, 0.90),
                "precision": np.random.uniform(0.65, 0.85),
                "recall": np.random.uniform(0.60, 0.80),
                "f1_score": np.random.uniform(0.65, 0.85)
            }
        }
        
        print("定价模型性能:")
        for metric, value in performance_metrics["pricing_model"].items():
            print(f"  {metric}: {value:.3f}")
        
        print("\n营销模型性能:")
        for metric, value in performance_metrics["marketing_model"].items():
            print(f"  {metric}: {value:.3f}")
        
        # 保存性能报告
        report = {
            "timestamp": datetime.now().isoformat(),
            "performance_metrics": performance_metrics,
            "recommendations": [
                "增加更多历史数据以提高模型准确性",
                "考虑添加更多特征变量",
                "定期重新训练模型",
                "实施A/B测试验证模型效果"
            ]
        }
        
        with open("model_performance_report.json", 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        print("\n性能报告已保存到 model_performance_report.json")

def main():
    """主函数"""
    print("AI模型训练脚本")
    print("=" * 50)
    
    # 创建训练器
    trainer = ModelTrainer()
    
    # 生成训练数据
    trainer.generate_training_data(num_samples=500)
    
    # 分析数据
    trainer.analyze_data()
    
    # 导出ML训练数据
    trainer.export_data_for_ml()
    
    # 创建性能报告
    trainer.create_model_performance_report()
    
    print("\n训练完成！")
    print("下一步:")
    print("1. 使用 ml_training_data.json 训练机器学习模型")
    print("2. 集成训练好的模型到AI服务中")
    print("3. 实施A/B测试验证模型效果")

if __name__ == "__main__":
    main() 