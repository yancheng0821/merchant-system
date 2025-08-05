#!/usr/bin/env python3
"""
AI服务测试脚本
用于验证AI服务的各个接口是否正常工作
"""

import requests
import json
from datetime import datetime, timedelta

# AI服务基础URL
BASE_URL = "http://localhost:5000"

def test_health_check():
    """测试健康检查接口"""
    print("=== 测试健康检查接口 ===")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"状态码: {response.status_code}")
        print(f"响应: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False

def test_predict_demand():
    """测试需求预测接口"""
    print("\n=== 测试需求预测接口 ===")
    
    # 构造测试数据
    mock_orders = []
    today = datetime.now()
    
    # 生成最近30天的模拟订单数据
    for i in range(30):
        order_date = today - timedelta(days=i)
        daily_orders = 2 + (i % 3)  # 每天2-4个订单
        
        for j in range(daily_orders):
            services = [
                {"id": "SRV001", "name": "理发服务", "amount": 50.0},
                {"id": "SRV002", "name": "洗剪吹", "amount": 80.0},
                {"id": "SRV003", "name": "染发服务", "amount": 120.0}
            ]
            service = services[(i + j) % len(services)]
            
            mock_orders.append({
                "orderId": f"ORD{i}_{j}",
                "serviceId": service["id"],
                "serviceName": service["name"],
                "orderDate": order_date.strftime("%Y-%m-%d"),
                "amount": service["amount"],
                "status": "completed"
            })
    
    request_data = {
        "tenantId": "test_tenant_001",
        "orders": mock_orders
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/ai/predict-demand",
            json=request_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False

def test_pricing_recommendation():
    """测试定价建议接口"""
    print("\n=== 测试定价建议接口 ===")
    
    request_data = {
        "tenantId": "test_tenant_001",
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
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/ai/pricing-recommendation",
            json=request_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False

def test_marketing_recommendation():
    """测试营销建议接口"""
    print("\n=== 测试营销建议接口 ===")
    
    request_data = {
        "tenantId": "test_tenant_001",
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
            f"{BASE_URL}/api/ai/marketing-recommendation",
            json=request_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False

def test_market_insights():
    """测试市场洞察接口"""
    print("\n=== 测试市场洞察接口 ===")
    
    try:
        response = requests.get(f"{BASE_URL}/api/ai/market-insights")
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False

def main():
    """主测试函数"""
    print("开始测试AI服务...")
    print(f"服务地址: {BASE_URL}")
    
    tests = [
        ("健康检查", test_health_check),
        ("需求预测", test_predict_demand),
        ("定价建议", test_pricing_recommendation),
        ("营销建议", test_marketing_recommendation),
        ("市场洞察", test_market_insights)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"{test_name} 测试异常: {e}")
            results.append((test_name, False))
    
    print("\n=== 测试结果汇总 ===")
    for test_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{test_name}: {status}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    print(f"\n总计: {passed}/{total} 个测试通过")

if __name__ == "__main__":
    main() 