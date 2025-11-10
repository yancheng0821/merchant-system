/**
 * 权限检查 Hook
 * 用于在组件中检查用户权限
 */

import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PermissionCode } from '../config/permissions';
import { RoleCode } from '../config/roles';

export interface UserPermissions {
  permissionCodes: PermissionCode[];
  permissionMap: Record<string, string[]>;
  roles: Array<{ roleCode: string; displayName: string; level: number }>;
  isSuperAdmin: boolean;
}

/**
 * 权限检查 Hook
 * @returns 权限检查函数和用户权限信息
 */
export const usePermission = () => {
  const { user } = useAuth();

  // 用户权限信息（从AuthContext中获取）
  const userPermissions = useMemo<UserPermissions>(() => {
    if (!user || !user.permissions) {
      return {
        permissionCodes: [],
        permissionMap: {},
        roles: [],
        isSuperAdmin: false,
      };
    }

    // 如果permissions是字符串数组（简单格式）
    if (Array.isArray(user.permissions)) {
      // 将简单的字符串数组转换为权限对象
      const permissionMap: Record<string, string[]> = {};
      user.permissions.forEach((code) => {
        const [resource, action] = code.split(':');
        if (resource && action) {
          if (!permissionMap[resource]) {
            permissionMap[resource] = [];
          }
          permissionMap[resource].push(action);
        }
      });

      return {
        permissionCodes: user.permissions,
        permissionMap,
        roles: user.roles?.map((roleCode) => ({
          roleCode,
          displayName: roleCode,
          level: 0,
        })) || [],
        isSuperAdmin: user.roles?.includes('SUPER_ADMIN') || user.roles?.includes('SYSTEM_ADMIN') || false,
      };
    }

    // 如果permissions是完整的UserPermissions对象
    return {
      permissionCodes: user.permissions.permissionCodes || [],
      permissionMap: user.permissions.permissionMap || {},
      roles: user.permissions.roles || [],
      isSuperAdmin: user.permissions.isSuperAdmin || false,
    };
  }, [user]);

  /**
   * 检查是否拥有指定权限
   * @param permissionCode 权限代码（如: products:create）
   * @returns 是否拥有权限
   */
  const hasPermission = (permissionCode: PermissionCode): boolean => {
    // 超级管理员拥有所有权限
    if (userPermissions.isSuperAdmin) {
      return true;
    }

    // 检查权限代码是否存在
    return userPermissions.permissionCodes.includes(permissionCode);
  };

  /**
   * 检查是否拥有指定资源和操作的权限
   * @param resource 资源模块（如: products）
   * @param action 操作类型（如: create）
   * @returns 是否拥有权限
   */
  const hasResourcePermission = (resource: string, action: string): boolean => {
    // 超级管理员拥有所有权限
    if (userPermissions.isSuperAdmin) {
      return true;
    }

    // 检查permissionMap中是否有对应的权限
    const actions = userPermissions.permissionMap[resource];
    return actions ? actions.includes(action) : false;
  };

  /**
   * 检查是否拥有任一指定权限
   * @param permissionCodes 权限代码数组
   * @returns 是否拥有任一权限
   */
  const hasAnyPermission = (permissionCodes: PermissionCode[]): boolean => {
    // 超级管理员拥有所有权限
    if (userPermissions.isSuperAdmin) {
      return true;
    }

    return permissionCodes.some((code) => userPermissions.permissionCodes.includes(code));
  };

  /**
   * 检查是否拥有所有指定权限
   * @param permissionCodes 权限代码数组
   * @returns 是否拥有所有权限
   */
  const hasAllPermissions = (permissionCodes: PermissionCode[]): boolean => {
    // 超级管理员拥有所有权限
    if (userPermissions.isSuperAdmin) {
      return true;
    }

    return permissionCodes.every((code) => userPermissions.permissionCodes.includes(code));
  };

  /**
   * 检查是否拥有指定角色
   * @param roleCode 角色代码
   * @returns 是否拥有角色
   */
  const hasRole = (roleCode: RoleCode): boolean => {
    return userPermissions.roles.some((role) => role.roleCode === roleCode);
  };

  /**
   * 检查是否拥有任一指定角色
   * @param roleCodes 角色代码数组
   * @returns 是否拥有任一角色
   */
  const hasAnyRole = (roleCodes: RoleCode[]): boolean => {
    return roleCodes.some((code) => hasRole(code));
  };

  /**
   * 检查是否是超级管理员
   * @returns 是否超级管理员
   */
  const isSuperAdmin = (): boolean => {
    return userPermissions.isSuperAdmin;
  };

  /**
   * 获取用户角色层级
   * @returns 最高角色层级
   */
  const getUserRoleLevel = (): number => {
    if (userPermissions.roles.length === 0) {
      return 0;
    }
    return Math.max(...userPermissions.roles.map((role) => role.level || 0));
  };

  /**
   * 检查是否可以管理指定层级的用户
   * @param targetLevel 目标用户的角色层级
   * @returns 是否可以管理
   */
  const canManageUserLevel = (targetLevel: number): boolean => {
    return getUserRoleLevel() > targetLevel;
  };

  return {
    // 权限信息
    userPermissions,

    // 权限检查函数
    hasPermission,
    hasResourcePermission,
    hasAnyPermission,
    hasAllPermissions,

    // 角色检查函数
    hasRole,
    hasAnyRole,
    isSuperAdmin,

    // 层级检查函数
    getUserRoleLevel,
    canManageUserLevel,
  };
};

// 默认导出
export default usePermission;
