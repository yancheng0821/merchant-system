-- Add permission for editing order amount in schedule payment dialog
-- V20251118_01__add_schedule_edit_amount_permission.sql
USE merchant_auth;

INSERT INTO merchant_auth.permissions (
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
) VALUES (
    'Schedule Edit Order Amount',
    'schedule:edit_amount',
    '编辑订单金额',
    'schedule',
    'edit_amount',
    'all',
    'schedule',
    'schedule',
    '/api/business/appointments/*/payment',
    'POST',
    '在结账时编辑订单金额',
    'ACTIVE'
);
