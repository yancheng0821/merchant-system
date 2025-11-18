/**
 * 权限模块分组配置
 * 定义权限管理界面的模块结构（一级模块 -> 二级子模块 -> 具体权限）
 */

export interface PermissionSubModule {
  name: string;              // 子模块名称（用于翻译key）
  resourceTypes: string[];   // 包含的 resource_type
}

export interface PermissionModuleConfig {
  name: string;                      // 模块名称（用于翻译key）
  icon?: string;                     // 图标（可选）
  subModules?: PermissionSubModule[]; // 子模块（如果有）
  resourceTypes?: string[];          // 直接包含的 resource_type（无子模块时）
}

/**
 * 权限模块结构定义
 * 这个配置决定了权限管理界面的展示顺序和分组
 */
export const PERMISSION_MODULE_STRUCTURE: PermissionModuleConfig[] = [
  // 1. Dashboard - 仪表盘
  {
    name: 'dashboard',
    resourceTypes: ['dashboard'],
  },

  // 2. Business - 业务模块（多级结构）
  {
    name: 'products',
    subModules: [
      {
        name: 'services',
        resourceTypes: ['products', 'product_categories'],
      },
      {
        name: 'packages',
        resourceTypes: ['packages'],
      },
    ],
  },

  // 3. Customers - 客户管理（多级结构）
  {
    name: 'customers',
    subModules: [
      {
        name: 'customer_list',
        resourceTypes: ['customers', 'customer_packages'],
      },
      {
        name: 'membership_tiers',
        resourceTypes: ['membership_tier'],
      },
    ],
  },

  // 4. Appointments - 预约管理
  {
    name: 'appointments',
    resourceTypes: ['appointments'],
  },

  // 5. Schedule - 排班管理
  {
    name: 'schedule',
    resourceTypes: ['schedule', 'staff_attendance'],
  },

  // 6. Resources - 资源管理（多级结构）
  {
    name: 'resources',
    subModules: [
      // 注意: 'general' (resources:view) 已废弃，菜单显示由 staff:view 或 room:view 控制
      // 注意: 'resource_expertise' 已废弃，功能未使用
      {
        name: 'staff_management',
        resourceTypes: ['staff_management'],
      },
      {
        name: 'room_management',
        resourceTypes: ['room_management'],
      },
    ],
  },

  // 7. Orders - 订单管理
  {
    name: 'orders',
    resourceTypes: ['orders'],
  },

  // 8. Analytics - 数据分析（多级结构）
  {
    name: 'analytics',
    subModules: [
      {
        name: 'revenue_analytics',
        resourceTypes: ['revenue_analytics'],
      },
      {
        name: 'service_analytics',
        resourceTypes: ['service_analytics'],
      },
      {
        name: 'staff_performance',
        resourceTypes: ['staff_performance'],
      },
      {
        name: 'appointment_heatmap',
        resourceTypes: ['appointment_heatmap'],
      },
      {
        name: 'ai_insights',
        resourceTypes: ['ai_insights'],
      },
      {
        name: 'order_stats',
        resourceTypes: ['order_stats'],
      },
    ],
  },

  // 9. Cost Management - 成本管理（多级结构）
  {
    name: 'costs',
    subModules: [
      {
        name: 'certificates',
        resourceTypes: ['certificate'],
      },
      {
        name: 'fixed_costs',
        resourceTypes: ['fixed_cost'],
      },
      {
        name: 'materials',
        resourceTypes: ['material'],
      },
    ],
  },

  // 10. Notifications - 通知管理（多级结构）
  {
    name: 'notifications',
    subModules: [
      // 注意: 'general' (notifications:view) 已废弃，菜单显示由具体子模块权限控制
      {
        name: 'notification_templates',
        resourceTypes: ['notification_templates'],
      },
      {
        name: 'notification_logs',
        resourceTypes: ['notification_logs'],
      },
    ],
  },

  // 11. Access Control - 访问控制（多级结构）
  {
    name: 'access_control',
    subModules: [
      {
        name: 'user_management',
        resourceTypes: ['users'],
      },
      {
        name: 'role_management',
        resourceTypes: ['roles'],
      },
      {
        name: 'audit_logs',
        resourceTypes: ['audit'],
      },
      {
        name: 'permission_management',
        resourceTypes: ['permissions'],
      },
    ],
  },

  // 12. Settings - 系统设置（多级结构）
  {
    name: 'settings',
    subModules: [
      {
        name: 'basic_settings',
        resourceTypes: ['basic_settings'],
      },
      {
        name: 'tax_settings',
        resourceTypes: ['tax_settings'],
      },
      {
        name: 'system_settings',
        resourceTypes: ['system_settings'],
      },
      {
        name: 'payment_settings',
        resourceTypes: ['payment_settings'],
      },
      {
        name: 'terminal_settings',
        resourceTypes: ['terminal_settings'],
      },
    ],
  },
];
