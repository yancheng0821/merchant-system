/**
 * 权限配置文件
 * 定义系统所有权限常量
 */

// 权限代码类型
export type PermissionCode = string;

// 权限定义接口
export interface Permission {
  code: PermissionCode;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

// ============================================================================
// Dashboard 权限
// ============================================================================
export const DASHBOARD_PERMISSIONS = {
  VIEW: 'dashboard:view',
} as const;

// ============================================================================
// Products（服务/套餐）权限
// ============================================================================
export const PRODUCT_PERMISSIONS = {
  VIEW: 'products:view',
  CREATE: 'products:create',
  UPDATE: 'products:update',
  DELETE: 'products:delete',
  MANAGE_CATEGORIES: 'product_categories:manage',
} as const;

export const PACKAGE_PERMISSIONS = {
  VIEW: 'packages:view',
  CREATE: 'packages:create',
  UPDATE: 'packages:update',
  DELETE: 'packages:delete',
} as const;

// ============================================================================
// Customers（客户）权限
// ============================================================================
export const CUSTOMER_PERMISSIONS = {
  VIEW: 'customers:view',
  CREATE: 'customers:create',
  UPDATE: 'customers:update',
  DELETE: 'customers:delete',
  IMPORT: 'customers:import',
  EXPORT: 'customers:export',
  VIEW_PACKAGES: 'customer_packages:view',
  PURCHASE_PACKAGE: 'customer_packages:purchase',
} as const;

// ============================================================================
// Appointments（预约）权限
// ============================================================================
export const APPOINTMENT_PERMISSIONS = {
  VIEW: 'appointments:view',
  // 注意: 以下权限已废弃，暂不使用
  // VIEW_OWN: 'appointments:view_own',
  // CREATE: 'appointments:create',
  // UPDATE: 'appointments:update',
  // DELETE: 'appointments:delete',
  // CHECKIN: 'appointments:checkin',
  // VIEW_STATS: 'appointments:view_stats',
} as const;

// ============================================================================
// Schedule（排班）权限
// ============================================================================
export const SCHEDULE_PERMISSIONS = {
  VIEW: 'schedule:view',
  CREATE: 'schedule:create',
  UPDATE: 'schedule:update',
  CANCEL: 'schedule:cancel',
  CHECKOUT: 'schedule:checkout',
  EDIT_NOTES: 'schedule:edit_notes',
  // 注意: 以下权限已废弃，暂不使用
  // VIEW_OWN: 'schedule:view_own',
  // DELETE: 'schedule:delete', // 已改为 CANCEL
  // VIEW_CALENDAR: 'schedule:view_calendar',
} as const;

// ============================================================================
// Resources（资源：员工/房间）权限
// ============================================================================
export const RESOURCE_PERMISSIONS = {
  // 注意: resources:view 已废弃，请使用 STAFF_PERMISSIONS.VIEW 或 ROOM_PERMISSIONS.VIEW
  // 注意: resource_expertise:manage 已废弃，功能未使用
  CREATE: 'resources:create',
  UPDATE: 'resources:update',
  DELETE: 'resources:delete',
} as const;

// ============================================================================
// Orders（订单）权限
// ============================================================================
export const ORDER_PERMISSIONS = {
  VIEW: 'orders:view',
  // 注意: 以下权限已废弃，暂不使用
  // CREATE: 'orders:create',
  // UPDATE: 'orders:update',
  // DELETE: 'orders:delete',
  // PAYMENT: 'orders:payment',
  // REFUND: 'orders:refund',
  // VIEW_STATS: 'orders:view_stats',
} as const;

// ============================================================================
// Analytics（数据分析）权限
// ============================================================================
export const ANALYTICS_PERMISSIONS = {
  VIEW: 'analytics:view',
  VIEW_INSIGHTS: 'analytics:view_insights',
  VIEW_PERFORMANCE: 'analytics:view_performance',
  VIEW_OWN_PERFORMANCE: 'analytics:view_own_performance',
} as const;

// ============================================================================
// Settings（设置）权限
// ============================================================================
export const SETTINGS_PERMISSIONS = {
  // 注意: settings:view 已废弃，请使用具体的子设置权限
  UPDATE_MERCHANT: 'settings:update_merchant',
  UPDATE_TAX: 'settings:update_tax',
  MANAGE_TERMINAL: 'settings:manage_terminal',
  MANAGE_STRIPE: 'settings:manage_stripe',
} as const;

// ============================================================================
// Notifications（通知）权限
// ============================================================================
export const NOTIFICATION_PERMISSIONS = {
  // 注意: notifications:view 已废弃，请使用 VIEW_LOGS 或 MANAGE_TEMPLATE
  MANAGE_TEMPLATE: 'notifications:manage_template',
  VIEW_LOGS: 'notifications:view_logs',
  RETRY: 'notifications:retry',
  DELETE_TEMPLATE: 'notifications:delete_template',
} as const;

// ============================================================================
// Users（用户管理）权限
// ============================================================================
export const USER_PERMISSIONS = {
  VIEW: 'users:view',
  UPDATE_STATUS: 'users:update_status', // 修改用户状态（启用/停用）
  ASSIGN_ROLES: 'users:assign_roles',
} as const;

// ============================================================================
// RBAC（角色权限管理）权限 - 仅超级管理员可访问整个界面
// ============================================================================
export const RBAC_PERMISSIONS = {
  VIEW_ROLES: 'rbac:view_roles',
  VIEW_PERMISSIONS: 'rbac:view_permissions',
  // 注：角色权限管理界面只有SUPER_ADMIN可进入，无需额外的manage/assign权限
} as const;

// ============================================================================
// Audit（审计日志）权限 - 店长和超级管理员
// ============================================================================
export const AUDIT_PERMISSIONS = {
  VIEW: 'audit:view',
  EXPORT: 'audit:export',
  VIEW_SENSITIVE: 'audit:view_sensitive',
} as const;

// ============================================================================
// 所有权限集合
// ============================================================================
export const ALL_PERMISSIONS = {
  DASHBOARD: DASHBOARD_PERMISSIONS,
  PRODUCT: PRODUCT_PERMISSIONS,
  PACKAGE: PACKAGE_PERMISSIONS,
  CUSTOMER: CUSTOMER_PERMISSIONS,
  APPOINTMENT: APPOINTMENT_PERMISSIONS,
  SCHEDULE: SCHEDULE_PERMISSIONS,
  RESOURCE: RESOURCE_PERMISSIONS,
  ORDER: ORDER_PERMISSIONS,
  ANALYTICS: ANALYTICS_PERMISSIONS,
  SETTINGS: SETTINGS_PERMISSIONS,
  NOTIFICATION: NOTIFICATION_PERMISSIONS,
  USER: USER_PERMISSIONS,
  RBAC: RBAC_PERMISSIONS,
  AUDIT: AUDIT_PERMISSIONS,
} as const;

// ============================================================================
// 权限分组（用于权限管理界面）
// ============================================================================
export interface PermissionGroup {
  name: string;
  displayName: string;
  permissions: Permission[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: 'dashboard',
    displayName: '仪表盘',
    permissions: [
      { code: 'dashboard:view', name: '查看仪表盘', resource: 'dashboard', action: 'view' },
    ],
  },
  {
    name: 'products',
    displayName: '服务管理',
    permissions: [
      { code: 'products:view', name: '查看服务', resource: 'products', action: 'view' },
      { code: 'products:create', name: '新增服务', resource: 'products', action: 'create' },
      { code: 'products:update', name: '编辑服务', resource: 'products', action: 'update' },
      { code: 'products:delete', name: '删除服务', resource: 'products', action: 'delete' },
      { code: 'product_categories:manage', name: '管理服务分类', resource: 'product_categories', action: 'manage' },
      { code: 'packages:view', name: '查看套餐', resource: 'packages', action: 'view' },
      { code: 'packages:create', name: '新增套餐', resource: 'packages', action: 'create' },
      { code: 'packages:update', name: '编辑套餐', resource: 'packages', action: 'update' },
      { code: 'packages:delete', name: '删除套餐', resource: 'packages', action: 'delete' },
    ],
  },
  {
    name: 'customers',
    displayName: '客户管理',
    permissions: [
      { code: 'customers:view', name: '查看客户', resource: 'customers', action: 'view' },
      { code: 'customers:create', name: '新增客户', resource: 'customers', action: 'create' },
      { code: 'customers:update', name: '编辑客户', resource: 'customers', action: 'update' },
      { code: 'customers:delete', name: '删除客户', resource: 'customers', action: 'delete' },
      { code: 'customers:import', name: '导入客户', resource: 'customers', action: 'import' },
      { code: 'customers:export', name: '导出客户', resource: 'customers', action: 'export' },
      { code: 'customer_packages:view', name: '查看客户套餐', resource: 'customer_packages', action: 'view' },
      { code: 'customer_packages:purchase', name: '购买套餐', resource: 'customer_packages', action: 'purchase' },
    ],
  },
  {
    name: 'appointments',
    displayName: '预约管理',
    permissions: [
      { code: 'appointments:view', name: '查看预约', resource: 'appointments', action: 'view' },
      // 注意: 以下权限已废弃，暂不使用
      // { code: 'appointments:view_own', name: '查看自己的预约', resource: 'appointments', action: 'view', description: '仅查看自己的预约' },
      // { code: 'appointments:create', name: '新增预约', resource: 'appointments', action: 'create' },
      // { code: 'appointments:update', name: '编辑预约', resource: 'appointments', action: 'update' },
      // { code: 'appointments:delete', name: '取消预约', resource: 'appointments', action: 'delete' },
      // { code: 'appointments:checkin', name: '预约签到', resource: 'appointments', action: 'checkin' },
      // { code: 'appointments:view_stats', name: '查看预约统计', resource: 'appointments', action: 'view_stats' },
    ],
  },
  {
    name: 'schedule',
    displayName: '排班管理',
    permissions: [
      { code: 'schedule:view', name: '查看日历', resource: 'schedule', action: 'view' },
      { code: 'schedule:create', name: '创建预约', resource: 'schedule', action: 'create' },
      { code: 'schedule:update', name: '修改预约', resource: 'schedule', action: 'update' },
      { code: 'schedule:cancel', name: '取消预约', resource: 'schedule', action: 'cancel' },
      { code: 'schedule:checkout', name: '预约结账', resource: 'schedule', action: 'checkout' },
      { code: 'schedule:edit_notes', name: '编辑备注', resource: 'schedule', action: 'edit_notes' },
      // 注意: 以下权限已废弃，暂不使用
      // { code: 'schedule:view_own', name: '查看自己的排班', resource: 'schedule', action: 'view', description: '仅查看自己的排班' },
      // { code: 'schedule:delete', name: '删除排班', resource: 'schedule', action: 'delete' }, // 已改为 cancel
      // { code: 'schedule:view_calendar', name: '查看日历', resource: 'schedule', action: 'view_calendar' },
    ],
  },
  {
    name: 'resources',
    displayName: '资源管理',
    permissions: [
      // 注意: resources:view 已废弃，请使用 staff:view 或 room:view
      // 注意: resource_expertise:manage 已废弃，功能未使用
      { code: 'resources:create', name: '新增资源', resource: 'resources', action: 'create' },
      { code: 'resources:update', name: '编辑资源', resource: 'resources', action: 'update' },
      { code: 'resources:delete', name: '删除资源', resource: 'resources', action: 'delete' },
    ],
  },
  {
    name: 'orders',
    displayName: '订单管理',
    permissions: [
      { code: 'orders:view', name: '查看订单', resource: 'orders', action: 'view' },
      // 注意: 以下权限已废弃，暂不使用
      // { code: 'orders:create', name: '创建订单', resource: 'orders', action: 'create' },
      // { code: 'orders:update', name: '编辑订单', resource: 'orders', action: 'update' },
      // { code: 'orders:delete', name: '删除订单', resource: 'orders', action: 'delete' },
      // { code: 'orders:payment', name: '处理支付', resource: 'orders', action: 'payment' },
      // { code: 'orders:refund', name: '退款', resource: 'orders', action: 'refund' },
      // { code: 'orders:view_stats', name: '查看收入统计', resource: 'orders', action: 'view_stats' },
    ],
  },
  {
    name: 'analytics',
    displayName: '数据分析',
    permissions: [
      { code: 'analytics:view', name: '查看数据分析', resource: 'analytics', action: 'view' },
      { code: 'analytics:view_insights', name: '查看AI洞察', resource: 'analytics', action: 'view_insights' },
      { code: 'analytics:view_performance', name: '查看业绩', resource: 'analytics', action: 'view_performance' },
      { code: 'analytics:view_own_performance', name: '查看自己的业绩', resource: 'analytics', action: 'view_performance', description: '仅查看自己的业绩' },
    ],
  },
  {
    name: 'settings',
    displayName: '系统设置',
    permissions: [
      // 注意: settings:view 已废弃，请使用具体的子设置权限
      { code: 'settings:update_merchant', name: '编辑商户信息', resource: 'settings', action: 'update_merchant' },
      { code: 'settings:update_tax', name: '编辑税务配置', resource: 'settings', action: 'update_tax' },
      { code: 'settings:manage_terminal', name: '管理终端', resource: 'settings', action: 'manage_terminal' },
      { code: 'settings:manage_stripe', name: '管理Stripe', resource: 'settings', action: 'manage_stripe' },
    ],
  },
  {
    name: 'notifications',
    displayName: '通知管理',
    permissions: [
      // 注意: notifications:view 已废弃，请使用 notifications:view_logs 或 notifications:manage_template
      { code: 'notifications:manage_template', name: '管理模板', resource: 'notifications', action: 'manage_template' },
      { code: 'notifications:view_logs', name: '查看日志', resource: 'notifications', action: 'view_logs' },
      { code: 'notifications:retry', name: '重试通知', resource: 'notifications', action: 'retry' },
      { code: 'notifications:delete_template', name: '删除模板', resource: 'notifications', action: 'delete_template' },
    ],
  },
  {
    name: 'users',
    displayName: '用户管理',
    permissions: [
      { code: 'users:view', name: '查看用户', resource: 'users', action: 'view' },
      { code: 'users:update_status', name: '修改用户状态', resource: 'users', action: 'update_status', description: '启用/停用用户' },
      { code: 'users:assign_roles', name: '分配角色', resource: 'users', action: 'assign_roles' },
    ],
  },
  {
    name: 'audit',
    displayName: '审计日志',
    permissions: [
      { code: 'audit:view', name: '查看审计日志', resource: 'audit', action: 'view' },
      { code: 'audit:export', name: '导出审计日志', resource: 'audit', action: 'export' },
      { code: 'audit:view_sensitive', name: '查看敏感操作日志', resource: 'audit', action: 'view_sensitive', description: '查看删除、权限变更等敏感操作' },
    ],
  },
];

// 辅助函数：获取权限显示名称
export const getPermissionName = (code: PermissionCode): string => {
  for (const group of PERMISSION_GROUPS) {
    const permission = group.permissions.find((p) => p.code === code);
    if (permission) {
      return permission.name;
    }
  }
  return code;
};

// 辅助函数：根据resource获取权限组
export const getPermissionsByResource = (resource: string): Permission[] => {
  const group = PERMISSION_GROUPS.find((g) => g.name === resource);
  return group ? group.permissions : [];
};
