-- 添加数据分析 - 订单统计权限
-- Author: System
-- Date: 2025-11-16

USE merchant_auth;

-- 插入新权限（如果不存在）
INSERT INTO permissions (permission_code, permission_name, display_name, resource, action, scope, resource_type, module, resource_path, http_method, description, status, created_at, updated_at)
SELECT 'analytics:view_order_stats', 'View Order Stats', '查看订单统计', 'analytics', 'view_order_stats', 'all', 'order_stats', 'analytics', '/api/business/analytics/orders*', 'GET', '查看订单统计数据和报表', 'ACTIVE', NOW(), NOW()
    WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE permission_code = 'analytics:view_order_stats'
);

-- 将权限授予超级管理员角色
INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM roles r
         CROSS JOIN permissions p
WHERE r.role_name = 'Super Admin'
  AND p.permission_code = 'analytics:view_order_stats'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

