-- ============================================
-- 删除 business_hours 表
-- 营业时间现在统一存储在 merchant_config 表中
-- ============================================

-- 删除 business_hours 表（如果存在）
DROP TABLE IF EXISTS merchant_management.business_hours;

-- 确认 business_hours 配置在 merchant_config 中
-- 如果不存在，可以手动插入默认值：
-- INSERT INTO merchant_management.merchant_config (tenant_id, config_key, config_value, description)
-- VALUES (1, 'business_hours', '{"monday":{"start":"09:00","end":"18:00","closed":false},"tuesday":{"start":"09:00","end":"18:00","closed":false},"wednesday":{"start":"09:00","end":"18:00","closed":false},"thursday":{"start":"09:00","end":"18:00","closed":false},"friday":{"start":"09:00","end":"18:00","closed":false},"saturday":{"start":"10:00","end":"17:00","closed":false},"sunday":{"start":"10:00","end":"17:00","closed":true}}', '营业时间配置');
