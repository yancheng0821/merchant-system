-- 成本管理模块权限配置

USE merchant_auth;

-- 证书管理权限
INSERT INTO merchant_auth.permissions (
    permission_name, permission_code, display_name, resource, action,
    scope, resource_type, module, resource_path, http_method,
    description, status
) VALUES
-- 查看证书
('View Certificates', 'costs:view_certificates', '查看证书',
 'costs', 'view_certificates', 'all', 'certificate', 'costs',
 '/api/business/costs/certificates', 'GET',
 '查看店铺证书列表', 'ACTIVE'),

-- 创建证书
('Create Certificate', 'costs:create_certificate', '创建证书',
 'costs', 'create_certificate', 'all', 'certificate', 'costs',
 '/api/business/costs/certificates', 'POST',
 '创建新的证书记录', 'ACTIVE'),

-- 更新证书
('Update Certificate', 'costs:update_certificate', '更新证书',
 'costs', 'update_certificate', 'all', 'certificate', 'costs',
 '/api/business/costs/certificates/*', 'PUT',
 '更新证书信息', 'ACTIVE'),

-- 删除证书
('Delete Certificate', 'costs:delete_certificate', '删除证书',
 'costs', 'delete_certificate', 'all', 'certificate', 'costs',
 '/api/business/costs/certificates/*', 'DELETE',
 '删除证书记录', 'ACTIVE'),

-- 查看固定成本
('View Fixed Costs', 'costs:view_fixed_costs', '查看固定成本',
 'costs', 'view_fixed_costs', 'all', 'fixed_cost', 'costs',
 '/api/business/costs/fixed-costs', 'GET',
 '查看固定成本列表', 'ACTIVE'),

-- 创建固定成本
('Create Fixed Cost', 'costs:create_fixed_cost', '创建固定成本',
 'costs', 'create_fixed_cost', 'all', 'fixed_cost', 'costs',
 '/api/business/costs/fixed-costs', 'POST',
 '创建新的固定成本记录', 'ACTIVE'),

-- 更新固定成本
('Update Fixed Cost', 'costs:update_fixed_cost', '更新固定成本',
 'costs', 'update_fixed_cost', 'all', 'fixed_cost', 'costs',
 '/api/business/costs/fixed-costs/*', 'PUT',
 '更新固定成本信息', 'ACTIVE'),

-- 删除固定成本
('Delete Fixed Cost', 'costs:delete_fixed_cost', '删除固定成本',
 'costs', 'delete_fixed_cost', 'all', 'fixed_cost', 'costs',
 '/api/business/costs/fixed-costs/*', 'DELETE',
 '删除固定成本记录', 'ACTIVE'),

-- 查看物料采购
('View Materials', 'costs:view_materials', '查看物料采购',
 'costs', 'view_materials', 'all', 'material', 'costs',
 '/api/business/costs/materials', 'GET',
 '查看物料采购列表', 'ACTIVE'),

-- 创建物料采购
('Create Material', 'costs:create_material', '创建物料采购',
 'costs', 'create_material', 'all', 'material', 'costs',
 '/api/business/costs/materials', 'POST',
 '创建新的物料采购记录', 'ACTIVE'),

-- 更新物料采购
('Update Material', 'costs:update_material', '更新物料采购',
 'costs', 'update_material', 'all', 'material', 'costs',
 '/api/business/costs/materials/*', 'PUT',
 '更新物料采购信息', 'ACTIVE'),

-- 删除物料采购
('Delete Material', 'costs:delete_material', '删除物料采购',
 'costs', 'delete_material', 'all', 'material', 'costs',
 '/api/business/costs/materials/*', 'DELETE',
 '删除物料采购记录', 'ACTIVE');
