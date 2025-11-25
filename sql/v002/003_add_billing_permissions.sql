USE merchant_auth;

-- ============================================================================
-- 添加账单管理权限
-- 版本: v002
-- 创建日期: 2025-11-24
-- 描述: 为商户账单管理功能添加相应的权限
-- ============================================================================

-- 只添加查看账单权限
-- 注意：账单的增删改操作由系统后端内部处理，不需要前端权限控制
INSERT INTO permissions (
    permission_name,
    permission_code,
    display_name,
    resource,
    action,
    scope,
    resource_type,
    module,
    resource_path,
    http_method,
    description,
    status
) VALUES
(
    'View Billing',
    'billing:view',
    '查看账单',
    'billing',
    'view',
    'all',
    'billing',
    'SETTINGS',
    '/api/merchant/invoice/**',
    'GET',
    '允许查看商户账单信息和历史记录',
    'ACTIVE'
);
