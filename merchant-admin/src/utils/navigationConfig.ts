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
} from '@mui/icons-material';

export type ResourceType = 'STAFF' | 'ROOM';

export interface MenuItemType {
  textKey: string;
  icon: ReactElement;
  id: string;
  children?: MenuItemType[];
  color?: string;
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
    { textKey: 'nav.dashboard', icon: React.createElement(DashboardIcon), id: 'dashboard', color: '#6366F1' },
    { textKey: 'nav.products', icon: React.createElement(StoreIcon), id: 'products', color: '#06B6D4' },
    { textKey: 'nav.orders', icon: React.createElement(OrdersIcon), id: 'orders', color: '#10B981' },
    { textKey: 'nav.customers', icon: React.createElement(CustomersIcon), id: 'customers', color: '#F59E0B' },
    { textKey: 'nav.appointments', icon: React.createElement(AppointmentsIcon), id: 'appointments', color: '#8B5CF6' },
  ];

  // 根据资源类型添加资源管理菜单项
  const resourceMenuItem = generateResourceMenuItem(merchantConfig);
  if (resourceMenuItem) {
    baseMenuItems.push(resourceMenuItem);
  }

  // 添加其他固定菜单项
  baseMenuItems.push(
    { textKey: 'nav.notifications', icon: React.createElement(NotificationsIcon), id: 'notifications', color: '#E91E63' },
    { textKey: 'nav.analytics', icon: React.createElement(AnalyticsIcon), id: 'analytics', color: '#F97316' },
    { textKey: 'nav.settings', icon: React.createElement(SettingsIcon), id: 'settings', color: '#6366F1' }
  );

  return baseMenuItems;
};

/**
 * 根据商户资源类型生成资源管理菜单项
 */
const generateResourceMenuItem = (merchantConfig?: MerchantConfig): MenuItemType | null => {
  if (!merchantConfig || !merchantConfig.resourceTypes || merchantConfig.resourceTypes.length === 0) {
    // 默认显示员工管理（向后兼容）
    return { textKey: 'nav.staff', icon: React.createElement(StaffIcon), id: 'resources', color: '#DC2626' };
  }

  const { resourceTypes } = merchantConfig;

  // 仅有员工资源
  if (resourceTypes.length === 1 && resourceTypes[0] === 'STAFF') {
    return { textKey: 'nav.staffManagement', icon: React.createElement(StaffIcon), id: 'resources', color: '#DC2626' };
  }

  // 仅有场地资源
  if (resourceTypes.length === 1 && resourceTypes[0] === 'ROOM') {
    return { textKey: 'nav.roomManagement', icon: React.createElement(RoomIcon), id: 'resources', color: '#DC2626' };
  }

  // 同时有员工和场地资源
  if (resourceTypes.includes('STAFF') && resourceTypes.includes('ROOM')) {
    return { textKey: 'nav.resources', icon: React.createElement(ResourceIcon), id: 'resources', color: '#DC2626' };
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