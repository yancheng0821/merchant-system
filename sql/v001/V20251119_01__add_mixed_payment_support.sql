-- ============================================
-- 混合支付功能支持
-- 创建时间：2024-11-19
--   2. 更新订单表支持混合支付标识
--   3. 礼品卡作为支付方式
-- ============================================

USE merchant_business;


-- 2. 更新orders表，添加混合支付相关字段
-- 检查并添加 is_mixed_payment 字段
SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'is_mixed_payment');
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE orders ADD COLUMN is_mixed_payment boolean DEFAULT FALSE COMMENT ''是否混合支付'' AFTER payment_method',
    'SELECT ''Column is_mixed_payment already exists'' AS result');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 tip_payment_method 字段
SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'tip_payment_method');
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE orders ADD COLUMN tip_payment_method varchar(50) DEFAULT NULL COMMENT ''小费支付方式'' AFTER tip_percentage',
    'SELECT ''Column tip_payment_method already exists'' AS result');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 gift_card_amount 字段
SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'gift_card_amount');
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE orders ADD COLUMN gift_card_amount decimal(10,2) DEFAULT 0.00 COMMENT ''礼品卡支付金额'' AFTER total_amount',
    'SELECT ''Column gift_card_amount already exists'' AS result');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 cash_amount 字段
SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'cash_amount');
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE orders ADD COLUMN cash_amount decimal(10,2) DEFAULT 0.00 COMMENT ''现金支付金额'' AFTER gift_card_amount',
    'SELECT ''Column cash_amount already exists'' AS result');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 card_amount 字段
SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'card_amount');
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE orders ADD COLUMN card_amount decimal(10,2) DEFAULT 0.00 COMMENT ''卡支付金额（信用卡+借记卡）'' AFTER cash_amount',
    'SELECT ''Column card_amount already exists'' AS result');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 package_amount 字段
SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'package_amount');
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE orders ADD COLUMN package_amount decimal(10,2) DEFAULT 0.00 COMMENT ''套餐支付金额'' AFTER card_amount',
    'SELECT ''Column package_amount already exists'' AS result');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. 确保order_services表有payment_method字段（兼容性检查）
SET @column_exists = 0;
SELECT COUNT(*) INTO @column_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'order_services'
  AND COLUMN_NAME = 'payment_method';

SET @sql = IF(@column_exists = 0,
  'ALTER TABLE order_services ADD COLUMN payment_method VARCHAR(50) DEFAULT NULL COMMENT ''服务的主要支付方式'' AFTER assigned_resource_type',
  'SELECT ''Column payment_method already exists in order_services'' AS result');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. 添加索引优化查询性能
-- 检查并创建 idx_orders_mixed_payment 索引
SET @index_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_orders_mixed_payment');
SET @sql = IF(@index_exists = 0,
    'CREATE INDEX idx_orders_mixed_payment ON orders(is_mixed_payment)',
    'SELECT ''Index idx_orders_mixed_payment already exists'' AS result');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并创建 idx_orders_tip_payment 索引
SET @index_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_orders_tip_payment');
SET @sql = IF(@index_exists = 0,
    'CREATE INDEX idx_orders_tip_payment ON orders(tip_payment_method)',
    'SELECT ''Index idx_orders_tip_payment already exists'' AS result');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并创建 idx_order_services_payment 索引
SET @index_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_services' AND INDEX_NAME = 'idx_order_services_payment');
SET @sql = IF(@index_exists = 0,
    'CREATE INDEX idx_order_services_payment ON order_services(payment_method)',
    'SELECT ''Index idx_order_services_payment already exists'' AS result');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并创建 idx_payment_details_amount 索引
SET @index_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_payment_details' AND INDEX_NAME = 'idx_payment_details_amount');
SET @sql = IF(@index_exists = 0,
    'CREATE INDEX idx_payment_details_amount ON order_payment_details(amount)',
    'SELECT ''Index idx_payment_details_amount already exists'' AS result');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 迁移完成
-- 说明：
--   1. 礼品卡由POS系统管理，本系统只记录支付金额
--   2. 混合支付不需要单独权限，使用现有结算权限即可
-- ============================================