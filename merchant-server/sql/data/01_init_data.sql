-- =====================================================
-- 初始数据脚本
-- 创建时间: 2024-07-19
-- 描述: 插入系统必需的初始数据
-- =====================================================

-- 设置字符集，解决中文乱码问题
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_client = utf8mb4;
SET character_set_results = utf8mb4;

-- 插入租户数据
USE merchant_auth;
INSERT INTO tenants (tenant_code, tenant_name, tenant_type, status, contact_person, contact_phone, contact_email) VALUES
('TENANT_001', '美发连锁店总部', 'CHAIN', 'ACTIVE', '张经理', '13800138001', 'zhang@example.com'),
('TENANT_002', '美发连锁店分店1', 'BRANCH', 'ACTIVE', '李店长', '13800138002', 'li@example.com'),
('TENANT_003', '独立美容院', 'INDEPENDENT', 'ACTIVE', '王老板', '13800138003', 'wang@example.com');

-- 插入角色数据
INSERT INTO roles (tenant_id, role_name, role_code, description) VALUES
(1, '系统管理员', 'SYSTEM_ADMIN', '系统超级管理员，拥有所有权限'),
(1, '连锁店管理员', 'CHAIN_ADMIN', '连锁店管理员，管理所有分店'),
(1, '分店管理员', 'BRANCH_ADMIN', '分店管理员，管理单个分店'),
(1, '员工', 'STAFF', '普通员工，基础操作权限');

-- 插入权限数据
INSERT INTO permissions (permission_name, permission_code, resource_type, resource_path, http_method, description) VALUES
-- 用户管理权限
('用户查看', 'USER:VIEW', 'USER', '/api/users/**', 'GET', '查看用户信息'),
('用户创建', 'USER:CREATE', 'USER', '/api/users', 'POST', '创建用户'),
('用户编辑', 'USER:UPDATE', 'USER', '/api/users/**', 'PUT', '编辑用户信息'),
('用户删除', 'USER:DELETE', 'USER', '/api/users/**', 'DELETE', '删除用户'),

-- 商户管理权限
('商户查看', 'MERCHANT:VIEW', 'MERCHANT', '/api/merchants/**', 'GET', '查看商户信息'),
('商户创建', 'MERCHANT:CREATE', 'MERCHANT', '/api/merchants', 'POST', '创建商户'),
('商户编辑', 'MERCHANT:UPDATE', 'MERCHANT', '/api/merchants/**', 'PUT', '编辑商户信息'),
('商户删除', 'MERCHANT:DELETE', 'MERCHANT', '/api/merchants/**', 'DELETE', '删除商户'),

-- 服务管理权限
('服务查看', 'SERVICE:VIEW', 'SERVICE', '/api/services/**', 'GET', '查看服务信息'),
('服务创建', 'SERVICE:CREATE', 'SERVICE', '/api/services', 'POST', '创建服务'),
('服务编辑', 'SERVICE:UPDATE', 'SERVICE', '/api/services/**', 'PUT', '编辑服务信息'),
('服务删除', 'SERVICE:DELETE', 'SERVICE', '/api/services/**', 'DELETE', '删除服务'),

-- 预约管理权限
('预约查看', 'APPOINTMENT:VIEW', 'APPOINTMENT', '/api/appointments/**', 'GET', '查看预约信息'),
('预约创建', 'APPOINTMENT:CREATE', 'APPOINTMENT', '/api/appointments', 'POST', '创建预约'),
('预约编辑', 'APPOINTMENT:UPDATE', 'APPOINTMENT', '/api/appointments/**', 'PUT', '编辑预约信息'),
('预约删除', 'APPOINTMENT:DELETE', 'APPOINTMENT', '/api/appointments/**', 'DELETE', '删除预约'),

-- 订单管理权限
('订单查看', 'ORDER:VIEW', 'ORDER', '/api/orders/**', 'GET', '查看订单信息'),
('订单创建', 'ORDER:CREATE', 'ORDER', '/api/orders', 'POST', '创建订单'),
('订单编辑', 'ORDER:UPDATE', 'ORDER', '/api/orders/**', 'PUT', '编辑订单信息'),
('订单删除', 'ORDER:DELETE', 'ORDER', '/api/orders/**', 'DELETE', '删除订单'),

-- 客户管理权限
('客户查看', 'CUSTOMER:VIEW', 'CUSTOMER', '/api/customers/**', 'GET', '查看客户信息'),
('客户创建', 'CUSTOMER:CREATE', 'CUSTOMER', '/api/customers', 'POST', '创建客户'),
('客户编辑', 'CUSTOMER:UPDATE', 'CUSTOMER', '/api/customers/**', 'PUT', '编辑客户信息'),
('客户删除', 'CUSTOMER:DELETE', 'CUSTOMER', '/api/customers/**', 'DELETE', '删除客户'),

-- 数据分析权限
('数据分析查看', 'ANALYTICS:VIEW', 'ANALYTICS', '/api/analytics/**', 'GET', '查看数据分析'),
('报表导出', 'REPORT:EXPORT', 'REPORT', '/api/reports/export', 'POST', '导出报表'),

-- AI功能权限
('AI推荐查看', 'AI:RECOMMENDATION:VIEW', 'AI', '/api/ai/recommendations/**', 'GET', '查看AI推荐'),
('AI分析查看', 'AI:ANALYSIS:VIEW', 'AI', '/api/ai/analysis/**', 'GET', '查看AI分析');

-- 为系统管理员分配所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- 为连锁店管理员分配管理权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE permission_code IN (
    'MERCHANT:VIEW', 'MERCHANT:CREATE', 'MERCHANT:UPDATE',
    'SERVICE:VIEW', 'SERVICE:CREATE', 'SERVICE:UPDATE',
    'APPOINTMENT:VIEW', 'APPOINTMENT:CREATE', 'APPOINTMENT:UPDATE',
    'ORDER:VIEW', 'ORDER:CREATE', 'ORDER:UPDATE',
    'CUSTOMER:VIEW', 'CUSTOMER:CREATE', 'CUSTOMER:UPDATE',
    'ANALYTICS:VIEW', 'REPORT:EXPORT',
    'AI:RECOMMENDATION:VIEW', 'AI:ANALYSIS:VIEW'
);

-- 为分店管理员分配基础权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE permission_code IN (
    'SERVICE:VIEW',
    'APPOINTMENT:VIEW', 'APPOINTMENT:CREATE', 'APPOINTMENT:UPDATE',
    'ORDER:VIEW', 'ORDER:CREATE', 'ORDER:UPDATE',
    'CUSTOMER:VIEW', 'CUSTOMER:CREATE', 'CUSTOMER:UPDATE',
    'ANALYTICS:VIEW'
);

-- 为员工分配基础权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE permission_code IN (
    'SERVICE:VIEW',
    'APPOINTMENT:VIEW', 'APPOINTMENT:UPDATE',
    'ORDER:VIEW', 'ORDER:UPDATE',
    'CUSTOMER:VIEW'
);

-- 插入测试用户（密码：password，使用BCrypt加密）
INSERT INTO users (tenant_id, username, email, password_hash, salt, real_name, status) VALUES
(1, 'admin', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'bcrypt_salt', '系统管理员', 'ACTIVE'),
(1, 'manager', 'manager@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'bcrypt_salt', '连锁店管理员', 'ACTIVE'),
(2, 'branch_manager', 'branch@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'bcrypt_salt', '分店管理员', 'ACTIVE'),
(1, 'staff1', 'staff1@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'bcrypt_salt', '员工1', 'ACTIVE'),
(1, 'testuser', 'test@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'bcrypt_salt', '测试用户', 'ACTIVE');

-- 为用户分配角色
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1), -- admin -> 系统管理员
(2, 2), -- manager -> 连锁店管理员
(3, 3), -- branch_manager -> 分店管理员
(4, 4), -- staff1 -> 员工
(5, 4); -- testuser -> 员工 