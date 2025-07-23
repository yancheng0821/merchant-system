#!/bin/bash

# 测试通知服务的脚本

echo "=== 测试通知服务 ==="

# 服务基础URL
NOTIFICATION_URL="http://localhost:8084"

echo "1. 测试预约确认通知..."
curl -X POST "${NOTIFICATION_URL}/api/v2/appointment-notifications/confirmation" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": 1,
    "tenantId": 1,
    "customerId": 1,
    "customerName": "张三",
    "customerPhone": "13800138000",
    "customerEmail": "zhangsan@example.com",
    "communicationPreference": "SMS",
    "appointmentDate": "2025-01-25",
    "appointmentTime": "14:30",
    "duration": 60,
    "totalAmount": 299.00,
    "status": "CONFIRMED",
    "notes": "首次预约",
    "staffName": "李美容师",
    "serviceName": "面部护理",
    "businessName": "美丽人生美容院",
    "businessAddress": "北京市朝阳区三里屯路123号",
    "businessPhone": "400-123-4567"
  }'

echo -e "\n\n2. 测试预约取消通知..."
curl -X POST "${NOTIFICATION_URL}/api/v2/appointment-notifications/cancellation" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": 2,
    "tenantId": 1,
    "customerId": 2,
    "customerName": "李四",
    "customerPhone": "13900139000",
    "customerEmail": "lisi@example.com",
    "communicationPreference": "EMAIL",
    "appointmentDate": "2025-01-26",
    "appointmentTime": "10:00",
    "duration": 90,
    "totalAmount": 399.00,
    "status": "CANCELLED",
    "staffName": "王美容师",
    "serviceName": "全身按摩",
    "businessName": "美丽人生美容院",
    "businessAddress": "北京市朝阳区三里屯路123号",
    "businessPhone": "400-123-4567"
  }'

echo -e "\n\n3. 测试预约完成通知..."
curl -X POST "${NOTIFICATION_URL}/api/v2/appointment-notifications/completion" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": 3,
    "tenantId": 1,
    "customerId": 3,
    "customerName": "王五",
    "customerPhone": "13700137000",
    "customerEmail": "wangwu@example.com",
    "communicationPreference": "SMS",
    "appointmentDate": "2025-01-24",
    "appointmentTime": "16:00",
    "duration": 120,
    "totalAmount": 599.00,
    "status": "COMPLETED",
    "staffName": "赵美容师",
    "serviceName": "美甲服务",
    "businessName": "美丽人生美容院",
    "businessAddress": "北京市朝阳区三里屯路123号",
    "businessPhone": "400-123-4567"
  }'

echo -e "\n\n4. 测试邮件通知..."
curl -X POST "${NOTIFICATION_URL}/api/v2/appointment-notifications/confirmation" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": 4,
    "tenantId": 1,
    "customerId": 4,
    "customerName": "赵六",
    "customerPhone": "13600136000",
    "customerEmail": "zhaoliu@example.com",
    "communicationPreference": "EMAIL",
    "appointmentDate": "2025-01-27",
    "appointmentTime": "09:00",
    "duration": 45,
    "totalAmount": 199.00,
    "status": "CONFIRMED",
    "staffName": "孙美容师",
    "serviceName": "眉毛修整",
    "businessName": "美丽人生美容院",
    "businessAddress": "北京市朝阳区三里屯路123号",
    "businessPhone": "400-123-4567"
  }'

echo -e "\n\n5. 查看通知模板..."
curl -X GET "${NOTIFICATION_URL}/api/notification/templates?tenantId=1"

echo -e "\n\n6. 查看通知日志..."
curl -X GET "${NOTIFICATION_URL}/api/notification/logs?tenantId=1&page=0&size=10"

echo -e "\n\n7. 初始化默认模板（如果需要）..."
curl -X POST "${NOTIFICATION_URL}/api/notification/templates/init-default?tenantId=1"

echo -e "\n\n=== 测试完成 ==="