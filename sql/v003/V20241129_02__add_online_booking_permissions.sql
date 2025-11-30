-- V20241129_02__add_online_booking_permissions.sql
-- 添加在线预约设置权限

USE merchant_auth;

-- 1. 查看在线预约设置权限
INSERT INTO permissions (
    permission_code,
    permission_name,
    display_name,
    resource,
    action,
    scope,
    resource_type,
    module,
    resource_path,
    http_method,
    description,
    status,
    created_at,
    updated_at
) SELECT
    'settings:view_online_booking',
    'View Online Booking Settings',
    '查看在线预约设置',
    'settings',
    'view',
    'all',
    'online_booking',
    'settings',
    '/api/business/online-booking-config',
    'GET',
    '查看在线预约设置',
    'ACTIVE',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE permission_code = 'settings:view_online_booking'
);

-- 2. 修改在线预约设置权限
INSERT INTO permissions (
    permission_code,
    permission_name,
    display_name,
    resource,
    action,
    scope,
    resource_type,
    module,
    resource_path,
    http_method,
    description,
    status,
    created_at,
    updated_at
) SELECT
    'settings:update_online_booking',
    'Update Online Booking Settings',
    '修改在线预约设置',
    'settings',
    'update',
    'all',
    'online_booking',
    'settings',
    '/api/business/online-booking-config',
    'PUT',
    '修改在线预约设置（包括启用/禁用、预约规则等）',
    'ACTIVE',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE permission_code = 'settings:update_online_booking'
);

