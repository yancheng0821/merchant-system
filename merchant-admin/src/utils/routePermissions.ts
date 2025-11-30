/**
 * 路由权限配置
 * 定义每个路由需要的权限或角色要求
 */

import { PermissionCode } from '../config/permissions';

export interface RoutePermissionConfig {
  // 路由路径（不含斜杠）
  path: string;
  // 需要的权限（满足任一即可）
  permissions?: PermissionCode[];
  // 是否需要超级管理员
  requireSuperAdmin?: boolean;
  // 是否允许无权限访问（公共路由）
  public?: boolean;
}

/**
 * 路由权限映射表
 */
export const ROUTE_PERMISSIONS: RoutePermissionConfig[] = [
  // 公共路由
  { path: 'dashboard', permissions: ['dashboard:view'] },
  { path: 'profile', public: true },

  // 业务模块路由
  { path: 'products', permissions: ['products:view', 'packages:view'] },
  { path: 'orders', permissions: ['orders:view'] },
  { path: 'customers', permissions: ['customers:view', 'membership_tiers:view'] },
  { path: 'appointments', permissions: ['appointments:view'] },
  { path: 'resources', permissions: ['staff:view', 'room:view'] },
  { path: 'schedule', permissions: ['schedule:view'] },
  { path: 'notifications', permissions: ['notifications:view_logs', 'notifications:manage_template'] },
  { path: 'marketing', permissions: ['marketing:view_rules', 'marketing:view_logs'] },
  { path: 'analytics', permissions: ['analytics:view_order_stats'] },
  { path: 'costs', permissions: ['costs:view_certificates', 'costs:view_fixed_costs', 'costs:view_materials'] },
  { path: 'settings', permissions: ['settings:update_merchant', 'settings:update_tax', 'settings:update_system'] },

  // 权限管理路由 - 拥有任意子权限即可访问
  { path: 'rbac', permissions: ['users:view', 'rbac:view_roles', 'rbac:view_permissions', 'audit:view'] },

  // 商户管理路由 - 仅超级管理员可访问
  { path: 'tenant-activation', requireSuperAdmin: true },
];

/**
 * 获取路由的权限配置
 */
export const getRoutePermissionConfig = (path: string): RoutePermissionConfig | undefined => {
  return ROUTE_PERMISSIONS.find(route => route.path === path);
};

/**
 * 检查用户是否有权限访问指定路由
 */
export const canAccessRoute = (
  path: string,
  userPermissions: PermissionCode[],
  isSuperAdmin: boolean
): boolean => {
  const routeConfig = getRoutePermissionConfig(path);

  // 如果路由未配置，默认拒绝访问（安全优先）
  if (!routeConfig) {
    console.warn(`Route "${path}" has no permission configuration`);
    return false;
  }

  // 超级管理员拥有所有权限
  if (isSuperAdmin) {
    return true;
  }

  // 公共路由允许访问
  if (routeConfig.public) {
    return true;
  }

  // 需要超级管理员但用户不是
  if (routeConfig.requireSuperAdmin) {
    return false;
  }

  // 检查权限
  if (routeConfig.permissions && routeConfig.permissions.length > 0) {
    // 满足任一权限即可访问
    return routeConfig.permissions.some(permission =>
      userPermissions.includes(permission)
    );
  }

  // 未指定任何权限要求，默认拒绝
  return false;
};
