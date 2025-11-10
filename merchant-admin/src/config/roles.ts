/**
 * 角色配置文件
 * 定义系统角色常量和角色-权限映射关系
 */

import { PermissionCode } from './permissions';

// 角色代码类型
export type RoleCode = 'SUPER_ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'RECEPTIONIST' | 'STAFF';

// 角色定义接口
export interface Role {
  code: RoleCode;
  name: string;
  displayName: string;
  level: number;
  description: string;
  isSystem: boolean;
}

// ============================================================================
// 系统角色定义
// ============================================================================
export const ROLES: Record<RoleCode, Role> = {
  SUPER_ADMIN: {
    code: 'SUPER_ADMIN',
    name: 'Super Admin',
    displayName: '超级管理员',
    level: 100,
    description: '拥有系统所有权限，可管理所有模块和用户',
    isSystem: true,
  },
  MANAGER: {
    code: 'MANAGER',
    name: 'Manager',
    displayName: '店长/经理',
    level: 80,
    description: '负责店铺日常运营管理，包括员工、客户、预约、订单管理',
    isSystem: true,
  },
  ACCOUNTANT: {
    code: 'ACCOUNTANT',
    name: 'Accountant',
    displayName: '财务',
    level: 60,
    description: '负责财务核对、数据分析、查看收入报表',
    isSystem: true,
  },
  RECEPTIONIST: {
    code: 'RECEPTIONIST',
    name: 'Receptionist',
    displayName: '前台接待',
    level: 50,
    description: '负责接待客户、管理预约、处理订单',
    isSystem: true,
  },
  STAFF: {
    code: 'STAFF',
    name: 'Staff',
    displayName: '技师/员工',
    level: 20,
    description: '负责提供服务，查看自己的预约和业绩',
    isSystem: true,
  },
};

// ============================================================================
// 角色权限映射（前端展示用，实际权限由后端控制）
// ============================================================================
export const ROLE_PERMISSIONS_MAP: Record<RoleCode, PermissionCode[]> = {
  SUPER_ADMIN: [
    // 拥有所有权限
    'dashboard:view',
    'products:view',
    'products:create',
    'products:update',
    'products:delete',
    'product_categories:manage',
    'packages:view',
    'packages:create',
    'packages:update',
    'packages:delete',
    'customers:view',
    'customers:create',
    'customers:update',
    'customers:delete',
    'customers:import',
    'customers:export',
    'customer_packages:view',
    'customer_packages:purchase',
    'appointments:view',
    // 注意: 以下预约权限已废弃，暂不使用
    // 'appointments:view_own',
    // 'appointments:create',
    // 'appointments:update',
    // 'appointments:delete',
    // 'appointments:checkin',
    // 'appointments:view_stats',
    'schedule:view',
    'schedule:create',
    'schedule:update',
    'schedule:cancel',
    'schedule:checkout',
    'schedule:edit_notes',
    // 注意: 以下排班权限已废弃，暂不使用
    // 'schedule:view_own',
    // 'schedule:delete', // 已改为 CANCEL
    // 'schedule:view_calendar',
    // 注意: resources:view 已废弃，菜单显示由 staff:view 或 room:view 控制
    // 注意: resource_expertise:manage 已废弃，功能未使用
    'resources:create',
    'resources:update',
    'resources:delete',
    'orders:view',
    // 注意: 以下订单权限已废弃，暂不使用
    // 'orders:create',
    // 'orders:update',
    // 'orders:delete',
    // 'orders:payment',
    // 'orders:refund',
    // 'orders:view_stats',
    'analytics:view',
    'analytics:view_insights',
    'analytics:view_performance',
    // 注意: settings:view 已废弃，菜单显示由具体子权限控制
    'settings:update_merchant',
    'settings:update_tax',
    'settings:manage_terminal',
    'settings:manage_stripe',
    // 注意: notifications:view 已废弃，菜单显示由 notifications:view_logs 或 notifications:manage_template 控制
    'notifications:manage_template',
    'notifications:view_logs',
    'notifications:retry',
    'notifications:delete_template',
    'users:view',
    'users:create',
    'users:update',
    'users:delete',
    'users:assign_roles',
  ],

  MANAGER: [
    // 完整业务权限，无用户管理
    'dashboard:view',
    'products:view',
    'products:create',
    'products:update',
    'products:delete',
    'product_categories:manage',
    'packages:view',
    'packages:create',
    'packages:update',
    'packages:delete',
    'customers:view',
    'customers:create',
    'customers:update',
    'customers:delete',
    'customers:import',
    'customers:export',
    'customer_packages:view',
    'customer_packages:purchase',
    'appointments:view',
    // 注意: 以下预约权限已废弃，暂不使用
    // 'appointments:view_own',
    // 'appointments:create',
    // 'appointments:update',
    // 'appointments:delete',
    // 'appointments:checkin',
    // 'appointments:view_stats',
    'schedule:view',
    'schedule:create',
    'schedule:update',
    'schedule:cancel',
    'schedule:checkout',
    'schedule:edit_notes',
    // 注意: 以下排班权限已废弃，暂不使用
    // 'schedule:view_own',
    // 'schedule:delete', // 已改为 CANCEL
    // 'schedule:view_calendar',
    // 注意: resources:view 已废弃，菜单显示由 staff:view 或 room:view 控制
    // 注意: resource_expertise:manage 已废弃，功能未使用
    'resources:create',
    'resources:update',
    'resources:delete',
    'orders:view',
    // 注意: 以下订单权限已废弃，暂不使用
    // 'orders:create',
    // 'orders:update',
    // 'orders:delete',
    // 'orders:payment',
    // 'orders:refund',
    // 'orders:view_stats',
    'analytics:view',
    'analytics:view_insights',
    'analytics:view_performance',
    // 注意: settings:view 已废弃，菜单显示由具体子权限控制
    'settings:update_merchant',
    'settings:update_tax',
    'settings:manage_terminal',
    'settings:manage_stripe',
    // 注意: notifications:view 已废弃，菜单显示由 notifications:view_logs 或 notifications:manage_template 控制
    'notifications:manage_template',
    'notifications:view_logs',
    'notifications:retry',
  ],

  ACCOUNTANT: [
    // 查看权限 + 订单/数据分析权限
    'dashboard:view',
    'orders:view',
    // 注意: 以下订单权限已废弃，暂不使用
    // 'orders:view_stats',
    // 'orders:refund',
    'analytics:view',
    'analytics:view_insights',
    'analytics:view_performance',
    'customers:view',
    'customers:export',
    'appointments:view',
    // 注意: appointments:view_stats 已废弃，暂不使用
  ],

  RECEPTIONIST: [
    // 客户、预约、订单相关权限
    'dashboard:view',
    'customers:view',
    'customers:create',
    'customers:update',
    'customer_packages:view',
    'customer_packages:purchase',
    'appointments:view',
    // 注意: 以下预约权限已废弃，暂不使用
    // 'appointments:create',
    // 'appointments:update',
    // 'appointments:delete',
    // 'appointments:checkin',
    'orders:view',
    // 注意: 以下订单权限已废弃，暂不使用
    // 'orders:create',
    // 'orders:payment',
    'schedule:view',
    // 注意: 以下排班权限已废弃，暂不使用
    // 'schedule:view_calendar',
    // 注意: resources:view 已废弃，需要查看员工/场地请添加 staff:view 或 room:view
  ],

  STAFF: [
    // 仅查看自己的预约、排班、业绩
    'dashboard:view',
    // 注意: appointments:view_own 已废弃，暂不使用
    // 注意: schedule:view_own 已废弃，暂不使用
    // 注意: schedule:view_calendar 已废弃，暂不使用
    'analytics:view_own_performance',
    'customers:view',
    'products:view',
    'packages:view',
  ],
};

// 辅助函数：获取角色显示名称
export const getRoleName = (code: RoleCode): string => {
  return ROLES[code]?.displayName || code;
};

// 辅助函数：获取角色权限列表
export const getRolePermissions = (code: RoleCode): PermissionCode[] => {
  return ROLE_PERMISSIONS_MAP[code] || [];
};

// 辅助函数：检查角色层级
export const isHigherRole = (roleCode1: RoleCode, roleCode2: RoleCode): boolean => {
  const role1 = ROLES[roleCode1];
  const role2 = ROLES[roleCode2];
  return role1 && role2 && role1.level > role2.level;
};

// 辅助函数：获取所有角色（按层级降序）
export const getAllRoles = (): Role[] => {
  return Object.values(ROLES).sort((a, b) => b.level - a.level);
};

// 辅助函数：检查是否是系统角色
export const isSystemRole = (code: RoleCode): boolean => {
  return ROLES[code]?.isSystem || false;
};
