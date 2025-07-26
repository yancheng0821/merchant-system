-- 创建 tenant_id = 4 的测试商户数据

USE merchant_management;

-- 1. 删除可能存在的旧数据（可选）
DELETE FROM merchant_settings WHERE merchant_id = 4;
DELETE FROM merchants WHERE id = 4 OR tenant_id = 4;

-- 2. 插入商户基础信息
INSERT INTO merchants (id, tenant_id, merchant_code, merchant_name, merchant_type, business_category, contact_person, contact_phone, contact_email, address, status) VALUES
(4, 4, 'MERCHANT_004', '综合服务中心', 'INDEPENDENT', '综合服务', '张经理', '400-888-9999', 'manager@test.com', '北京市朝阳区测试路123号', 'ACTIVE');

-- 3. 插入商户配置数据
INSERT INTO merchant_settings (merchant_id, setting_key, setting_value, setting_type, description) VALUES
(4, 'resource_types', '["STAFF", "ROOM"]', 'JSON', '商户支持的资源类型'),
(4, 'appointment_settings', '{"advance_booking_days": 30, "cancellation_hours": 24, "reminder_hours": 2, "auto_confirm": true}', 'JSON', '预约相关设置'),
(4, 'notification_settings', '{"sms_enabled": true, "email_enabled": true, "push_enabled": false}', 'JSON', '通知设置');

-- 4. 验证插入结果
SELECT 
    '=== 商户信息 ===' as section;

SELECT 
    id as merchant_id,
    tenant_id,
    merchant_code,
    merchant_name,
    merchant_type,
    business_category,
    contact_person,
    status
FROM merchants 
WHERE tenant_id = 4;

SELECT 
    '=== 商户配置 ===' as section;

SELECT 
    ms.merchant_id,
    m.tenant_id,
    ms.setting_key,
    ms.setting_value,
    ms.setting_type
FROM merchant_settings ms
JOIN merchants m ON ms.merchant_id = m.id
WHERE m.tenant_id = 4
ORDER BY ms.setting_key;

-- 5. 测试API查询语句
SELECT 
    '=== API查询测试 ===' as section;

SELECT 
    ms.id, 
    m.tenant_id, 
    ms.setting_key as configKey, 
    ms.setting_value as configValue, 
    ms.description, 
    ms.created_at, 
    ms.updated_at 
FROM merchant_settings ms 
JOIN merchants m ON ms.merchant_id = m.id 
WHERE m.tenant_id = 4;