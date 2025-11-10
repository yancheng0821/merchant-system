/**
 * 权限守卫组件
 * 根据用户权限控制子组件的显示/隐藏
 */

import React from 'react';
import { usePermission } from '../../hooks/usePermission';
import { PermissionCode } from '../../config/permissions';
import { RoleCode } from '../../config/roles';

export interface PermissionGuardProps {
  /** 所需权限代码 */
  permission?: PermissionCode;
  /** 所需权限代码数组（任一权限即可） */
  anyPermission?: PermissionCode[];
  /** 所需权限代码数组（需要所有权限） */
  allPermissions?: PermissionCode[];
  /** 所需资源 */
  resource?: string;
  /** 所需操作（权限相关） */
  permissionAction?: string;
  /** 所需角色 */
  role?: RoleCode;
  /** 所需角色数组（任一角色即可） */
  anyRole?: RoleCode[];
  /** 无权限时显示的替代内容 */
  fallback?: React.ReactNode;
  /** 子组件 */
  children: React.ReactNode;
}

/**
 * 权限守卫组件
 * 使用示例:
 * <PermissionGuard permission="products:create">
 *   <Button>新增服务</Button>
 * </PermissionGuard>
 *
 * <PermissionGuard anyRole={['MANAGER', 'SUPER_ADMIN']}>
 *   <AdminPanel />
 * </PermissionGuard>
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  anyPermission,
  allPermissions,
  resource,
  permissionAction,
  role,
  anyRole,
  fallback = null,
  children,
}) => {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasResourcePermission,
    hasRole,
    hasAnyRole,
  } = usePermission();

  // 检查权限
  const allowed = React.useMemo(() => {
    // 检查单个权限
    if (permission && !hasPermission(permission)) {
      return false;
    }

    // 检查任一权限
    if (anyPermission && !hasAnyPermission(anyPermission)) {
      return false;
    }

    // 检查所有权限
    if (allPermissions && !hasAllPermissions(allPermissions)) {
      return false;
    }

    // 检查资源和操作
    if (resource && permissionAction && !hasResourcePermission(resource, permissionAction)) {
      return false;
    }

    // 检查单个角色
    if (role && !hasRole(role)) {
      return false;
    }

    // 检查任一角色
    if (anyRole && !hasAnyRole(anyRole)) {
      return false;
    }

    return true;
  }, [
    permission,
    anyPermission,
    allPermissions,
    resource,
    permissionAction,
    role,
    anyRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasResourcePermission,
    hasRole,
    hasAnyRole,
  ]);

  // 无权限时显示替代内容
  if (!allowed) {
    return <>{fallback}</>;
  }

  // 有权限，显示子组件
  return <>{children}</>;
};

export default PermissionGuard;
