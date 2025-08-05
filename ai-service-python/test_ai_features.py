#!/usr/bin/env python3
"""
AI服务功能测试脚本
测试定价建议和营销建议功能
"""

import requests
import json
from datetime import datetime

# AI服务地址
AI_SERVICE_URL = "http://localhost:8000"

def test_health_check():
    """测试健康检查"""
    print("=== 测试健康检查 ===")
    try:
        response = requests.get(f"{AI_SERVICE_URL}/health")
        print(f"状态码: {response.status_code}")
        print(f"响应: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"健康检查失败: {e}")
        return False

def test_pricing_recommendation():
    """测试定价建议功能"""
    print("\n=== 测试定价建议功能 ===")
    
    # 测试数据
    pricing_request = {
        "tenantId": "tenant_001",
        "serviceInfo": {
            "serviceId": "service_001",
            "serviceName": "高级美容护理",
            "currentPrice": 180.0,
            "category": "beauty",
            "duration": 90,
            "cost": 80.0
        },
        "marketData": {
            "competitorPrices": [160.0, 175.0, 190.0, 165.0],
            "marketDemand": "high",
            "seasonality": "peak",
            "customerSegment": "premium"
        },
        "businessGoals": "maximize_profit"
    }
    
    try:
        response = requests.post(
            f"{AI_SERVICE_URL}/api/ai/pricing-recommendation",
            json=pricing_request,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("定价建议结果:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
        else:
            print(f"错误: {response.text}")
            
        return response.status_code == 200
    except Exception as e:
        print(f"定价建议测试失败: {e}")
        return False

def test_marketing_recommendation():
    """测试营销建议功能"""
    print("\n=== 测试营销建议功能 ===")
    
    # 测试数据
    marketing_request = {
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
    
    try:
        response = requests.post(
            f"{AI_SERVICE_URL}/api/ai/marketing-recommendation",
            json=marketing_request,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("营销建议结果:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
        else:
            print(f"错误: {response.text}")
            
        return response.status_code == 200
    except Exception as e:
        print(f"营销建议测试失败: {e}")
        return False

def test_market_insights():
    """测试市场洞察功能"""
    print("\n=== 测试市场洞察功能 ===")
    
    try:
        response = requests.get(f"{AI_SERVICE_URL}/api/ai/market-insights")
        
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("市场洞察结果:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
        else:
            print(f"错误: {response.text}")
            
        return response.status_code == 200
    except Exception as e:
        print(f"市场洞察测试失败: {e}")
        return False

def test_existing_features():
    """测试现有功能"""
    print("\n=== 测试现有功能 ===")
    
    # 测试需求预测
    print("--- 测试需求预测 ---")
    demand_request = {
        "tenantId": "tenant_001",
        "orders": [
            {
                "orderId": "order_001",
                "serviceId": "service_001", 
                "serviceName": "美容护理",
                "orderDate": "2024-01-15",
                "amount": 180.0,
                "status": "completed"
            },
            {
                "orderId": "order_002",
                "serviceId": "service_001",
                "serviceName": "美容护理", 
                "orderDate": "2024-01-16",
                "amount": 180.0,
                "status": "completed"
            }
        ]
    }
    
    try:
        response = requests.post(
            f"{AI_SERVICE_URL}/api/ai/predict-demand",
            json=demand_request,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"需求预测状态码: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("需求预测结果:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
        else:
            print(f"需求预测错误: {response.text}")
    except Exception as e:
        print(f"需求预测测试失败: {e}")

def main():
    """主测试函数"""
    print("AI服务功能测试开始")
    print(f"测试时间: {datetime.now()}")
    print(f"AI服务地址: {AI_SERVICE_URL}")
    
    # 测试结果统计
    test_results = []
    
    # 测试健康检查
    test_results.append(("健康检查", test_health_check()))
    
    # 测试新功能
    test_results.append(("定价建议", test_pricing_recommendation()))
    test_results.append(("营销建议", test_marketing_recommendation()))
    test_results.append(("市场洞察", test_market_insights()))
    
    # 测试现有功能
    test_existing_features()
    
    # 输出测试总结
    print("\n=== 测试总结 ===")
    for test_name, result in test_results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{test_name}: {status}")
    
    passed_tests = sum(1 for _, result in test_results if result)
    total_tests = len(test_results)
    print(f"\n总体结果: {passed_tests}/{total_tests} 个测试通过")

if __name__ == "__main__":
    main() 