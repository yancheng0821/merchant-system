import React, { ReactElement } from 'react';
import {
  Dashboard as DashboardIcon,
  Store as StoreIcon,
  ShoppingCart as OrdersIcon,
  People as CustomersIcon,
  CalendarToday as AppointmentsIcon,
  BarChart as AnalyticsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Badge as StaffIcon,
  Room as RoomIcon,
  ManageAccounts as ResourceIcon,
  EventNote as ShiftIcon,
  AdminPanelSettings as RBACIcon,
  AccountBalance as CostsIcon,
  Business as TenantIcon,
} from '@mui/icons-material';
import { PermissionCode } from '../config/permissions';
import { RoleCode } from '../config/roles';

export type ResourceType = 'STAFF' | 'ROOM';

export interface MenuItemType {
  textKey: string;
  icon: ReactElement;
  id: string;
  children?: MenuItemType[];
  color?: string;
  permission?: PermissionCode;
  anyPermission?: PermissionCode[];
  allPermissions?: PermissionCode[];
  role?: RoleCode;
  anyRole?: RoleCode[];
  requireSuperAdmin?: boolean;
}

export interface MerchantConfig {
  merchantId: number;
  resourceTypes: ResourceType[];
}

/**
 * 根据商户资源类型动态生成导航栏配置
 */
export const generateNavigationConfig = (merchantConfig?: MerchantConfig): MenuItemType[] => {
  const baseMenuItems: MenuItemType[] = [
    // 1. 仪表盘 - 总览
    {
      textKey: 'nav.dashboard',
      icon: React.createElement(DashboardIcon),
      id: 'dashboard',
      color: '#6366F1',
      permission: 'dashboard:view' as PermissionCode
    },
    // 2. 预约管理 - 核心业务流程
    {
      textKey: 'nav.appointments',
      icon: React.createElement(AppointmentsIcon),
      id: 'appointments',
      color: '#8B5CF6',
      permission: 'appointments:view' as PermissionCode
    },
  ];

  // 3. 日程管理 - 紧跟预约管理
  baseMenuItems.push({
    textKey: 'nav.schedule',
    icon: React.createElement(ShiftIcon),
    id: 'schedule',
    color: '#3B82F6',
    permission: 'schedule:view' as PermissionCode
  });

  // 4. 客户管理 - 客户关系维护
  baseMenuItems.push({
    textKey: 'nav.customers',
    icon: React.createElement(CustomersIcon),
    id: 'customers',
    color: '#EC4899',
    anyPermission: ['customers:view', 'membership_tiers:view'] as PermissionCode[]
  });

  // 5. 订单/收银 - 财务流程
  baseMenuItems.push({
    textKey: 'nav.orders',
    icon: React.createElement(OrdersIcon),
    id: 'orders',
    color: '#10B981',
    permission: 'orders:view' as PermissionCode
  });

  // 6. 服务管理 - 产品配置
  baseMenuItems.push({
    textKey: 'nav.products',
    icon: React.createElement(StoreIcon),
    id: 'products',
    color: '#06B6D4',
    permission: 'products:view' as PermissionCode
  });

  // 7. 员工/资源管理 - 根据资源类型动态添加
  const resourceMenuItem = generateResourceMenuItem(merchantConfig);
  if (resourceMenuItem) {
    baseMenuItems.push(resourceMenuItem);
  }

  // 8. 通知管理 - 客户沟通
  baseMenuItems.push({
    textKey: 'nav.notifications',
    icon: React.createElement(NotificationsIcon),
    id: 'notifications',
    color: '#F97316',
    anyPermission: ['notifications:view_logs', 'notifications:manage_template'] as PermissionCode[]
  });

  // 9. 数据分析 - 业务洞察（目前只有订单统计）
  baseMenuItems.push({
    textKey: 'nav.analytics',
    icon: React.createElement(AnalyticsIcon),
    id: 'analytics',
    color: '#0891B2',
    permission: 'analytics:view_order_stats' as PermissionCode
  });

  // 10. 成本管理 - 财务成本
  baseMenuItems.push({
    textKey: 'nav.costs',
    icon: React.createElement(CostsIcon),
    id: 'costs',
    color: '#DC2626',
    anyPermission: [
      'costs:view_certificates',
      'costs:view_fixed_costs',
      'costs:view_materials'
    ] as PermissionCode[]
  });

  // 11. 用户权限 - 系统管理（分隔线上方最后一项）
  baseMenuItems.push({
    textKey: 'nav.rbac',
    icon: React.createElement(RBACIcon),
    id: 'rbac',
    color: '#7C3AED',
    anyPermission: ['users:view', 'rbac:view_roles', 'rbac:view_permissions', 'audit:view'] as PermissionCode[]
  });

  // 12. 商户管理 - 超级管理员专用
  baseMenuItems.push({
    textKey: 'nav.tenantActivation',
    icon: React.createElement(TenantIcon),
    id: 'tenant-activation',
    color: '#14B8A6',
    requireSuperAdmin: true
  });

  // 13. 设置 - 系统配置（最底部）
  baseMenuItems.push({
    textKey: 'nav.settings',
    icon: React.createElement(SettingsIcon),
    id: 'settings',
    color: '#6B7280',
    anyPermission: ['settings:update_merchant', 'settings:update_tax', 'settings:update_system'] as PermissionCode[]
  });

  return baseMenuItems;
};

/**
 * 根据商户资源类型生成资源管理菜单项
 */
const generateResourceMenuItem = (merchantConfig?: MerchantConfig): MenuItemType | null => {
  if (!merchantConfig || !merchantConfig.resourceTypes || merchantConfig.resourceTypes.length === 0) {
    // 默认显示员工管理（向后兼容）
    return {
      textKey: 'nav.staff',
      icon: React.createElement(StaffIcon),
      id: 'resources',
      color: '#3B82F6',
      anyPermission: ['staff:view', 'room:view'] as PermissionCode[]
    };
  }

  const { resourceTypes } = merchantConfig;

  // 仅有员工资源
  if (resourceTypes.length === 1 && resourceTypes[0] === 'STAFF') {
    return {
      textKey: 'nav.staffManagement',
      icon: React.createElement(StaffIcon),
      id: 'resources',
      color: '#3B82F6',
      permission: 'staff:view' as PermissionCode
    };
  }

  // 仅有场地资源
  if (resourceTypes.length === 1 && resourceTypes[0] === 'ROOM') {
    return {
      textKey: 'nav.roomManagement',
      icon: React.createElement(RoomIcon),
      id: 'resources',
      color: '#3B82F6',
      permission: 'room:view' as PermissionCode
    };
  }

  // 同时有员工和场地资源
  if (resourceTypes.includes('STAFF') && resourceTypes.includes('ROOM')) {
    return {
      textKey: 'nav.resources',
      icon: React.createElement(ResourceIcon),
      id: 'resources',
      color: '#3B82F6',
      anyPermission: ['staff:view', 'room:view'] as PermissionCode[]
    };
  }

  return null;
};

/**
 * 获取资源管理页面标题
 */
export const getResourcePageTitle = (merchantConfig?: MerchantConfig): string => {
  if (!merchantConfig || !merchantConfig.resourceTypes || merchantConfig.resourceTypes.length === 0) {
    return 'nav.staff'; // 默认员工管理
  }

  const { resourceTypes } = merchantConfig;

  if (resourceTypes.length === 1 && resourceTypes[0] === 'STAFF') {
    return 'nav.staffManagement';
  }

  if (resourceTypes.length === 1 && resourceTypes[0] === 'ROOM') {
    return 'nav.roomManagement';
  }

  if (resourceTypes.includes('STAFF') && resourceTypes.includes('ROOM')) {
    return 'nav.resources';
  }

  return 'nav.resources';
};

/**
 * 检查是否应该显示资源类型选择器
 */
export const shouldShowResourceTypeSelector = (merchantConfig?: MerchantConfig): boolean => {
  if (!merchantConfig || !merchantConfig.resourceTypes) {
    return false;
  }

  return merchantConfig.resourceTypes.length > 1;
};

/**
 * 获取可用的资源类型选项
 */
export const getAvailableResourceTypes = (merchantConfig?: MerchantConfig): ResourceType[] => {
  if (!merchantConfig || !merchantConfig.resourceTypes) {
    return ['STAFF']; // 默认只有员工
  }

  return merchantConfig.resourceTypes;
};

/**
 * 路由路径配置
 */
export const ROUTE_PATHS = {
  DASHBOARD: '/dashboard',
  PRODUCTS: '/products',
  ORDERS: '/orders',
  CUSTOMERS: '/customers',
  APPOINTMENTS: '/appointments',
  RESOURCES: '/resources', // 统一的资源管理路径
  NOTIFICATIONS: '/notifications',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
} as const;

/**
 * 获取资源管理路由配置
 */
export const getResourceRouteConfig = () => {
  return {
    path: ROUTE_PATHS.RESOURCES,
    component: 'ResourceManagement', // 统一的资源管理组件
  };
};