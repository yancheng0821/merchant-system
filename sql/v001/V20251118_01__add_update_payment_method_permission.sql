-- 添加订单 - 修改支付方式权限
-- Author: System
-- Date: 2025-11-18

USE merchant_auth;

-- 插入新权限（如果不存在）
INSERT INTO permissions (permission_code, permission_name, display_name, resource, action, scope, resource_type, module, resource_path, http_method, description, status, created_at, updated_at)
SELECT 'orders:update_payment_method', 'Update Payment Method', '修改支付方式', 'orders', 'update', 'all', 'orders', 'orders', '/api/business/orders/*/payment-method', 'PUT', '修改小费的支付方式', 'ACTIVE', NOW(), NOW()
    WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE permission_code = 'orders:update_payment_method'
);
