/**
 * 菜单过滤工具
 * 根据用户权限过滤导航菜单
 */

import { PermissionCode } from '../config/permissions';
import { RoleCode } from '../config/roles';
import { MenuItemType } from './navigationConfig';

// 使用 MenuItemType 作为菜单项类型
export type MenuItem = MenuItemType;

/**
 * 检查菜单项权限
 * @param item 菜单项
 * @param userPermissions 用户权限代码列表
 * @param userRoles 用户角色代码列表
 * @param isSuperAdmin 是否超级管理员
 * @returns 是否有权限访问该菜单项
 */
const hasMenuPermission = (
  item: MenuItem,
  userPermissions: PermissionCode[],
  userRoles: RoleCode[],
  isSuperAdmin: boolean
): boolean => {
  // 超级管理员拥有所有权限
  if (isSuperAdmin) {
    return true;
  }

  // 检查是否需要超级管理员
  if (item.requireSuperAdmin) {
    return false;
  }

  // 检查单个权限
  if (item.permission) {
    return userPermissions.includes(item.permission);
  }

  // 检查任一权限
  if (item.anyPermission && item.anyPermission.length > 0) {
    return item.anyPermission.some((perm) => userPermissions.includes(perm));
  }

  // 检查所有权限
  if (item.allPermissions && item.allPermissions.length > 0) {
    return item.allPermissions.every((perm) => userPermissions.includes(perm));
  }

  // 检查单个角色
  if (item.role) {
    return userRoles.includes(item.role);
  }

  // 检查任一角色
  if (item.anyRole && item.anyRole.length > 0) {
    return item.anyRole.some((role) => userRoles.includes(role));
  }

  // 如果没有指定任何权限要求，默认允许访问
  return true;
};

/**
 * 过滤菜单列表
 * @param menus 菜单列表
 * @param userPermissions 用户权限代码列表
 * @param userRoles 用户角色代码列表
 * @param isSuperAdmin 是否超级管理员
 * @returns 过滤后的菜单列表
 */
export const filterMenus = (
  menus: MenuItem[],
  userPermissions: PermissionCode[],
  userRoles: RoleCode[],
  isSuperAdmin: boolean
): MenuItem[] => {
  return menus
    .filter((item) => {
      // 检查当前菜单项权限
      const hasPermission = hasMenuPermission(item, userPermissions, userRoles, isSuperAdmin);

      // 如果当前菜单项无权限，检查是否有子菜单有权限
      if (!hasPermission && item.children && item.children.length > 0) {
        const filteredChildren = filterMenus(item.children, userPermissions, userRoles, isSuperAdmin);
        // 如果有可访问的子菜单，则保留父菜单
        return filteredChildren.length > 0;
      }

      return hasPermission;
    })
    .map((item) => {
      // 递归过滤子菜单
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: filterMenus(item.children, userPermissions, userRoles, isSuperAdmin),
        };
      }
      return item;
    });
};

/**
 * 检查菜单ID是否可访问
 * @param menuId 菜单ID
 * @param menus 菜单列表
 * @param userPermissions 用户权限代码列表
 * @param userRoles 用户角色代码列表
 * @param isSuperAdmin 是否超级管理员
 * @returns 是否可访问
 */
export const isMenuAccessible = (
  menuId: string,
  menus: MenuItem[],
  userPermissions: PermissionCode[],
  userRoles: RoleCode[],
  isSuperAdmin: boolean
): boolean => {
  for (const item of menus) {
    // 检查当前菜单项ID
    if (item.id === menuId) {
      return hasMenuPermission(item, userPermissions, userRoles, isSuperAdmin);
    }

    // 递归检查子菜单
    if (item.children && item.children.length > 0) {
      if (isMenuAccessible(menuId, item.children, userPermissions, userRoles, isSuperAdmin)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * 查找菜单项
 * @param id 菜单ID
 * @param menus 菜单列表
 * @returns 菜单项或null
 */
export const findMenuItem = (id: string, menus: MenuItem[]): MenuItem | null => {
  for (const item of menus) {
    if (item.id === id) {
      return item;
    }

    if (item.children && item.children.length > 0) {
      const found = findMenuItem(id, item.children);
      if (found) {
        return found;
      }
    }
  }

  return null;
};

/**
 * 获取第一个可访问的菜单项
 * @param menus 菜单列表
 * @param userPermissions 用户权限代码列表
 * @param userRoles 用户角色代码列表
 * @param isSuperAdmin 是否超级管理员
 * @returns 第一个可访问的菜单项或null
 */
export const getFirstAccessibleMenu = (
  menus: MenuItem[],
  userPermissions: PermissionCode[],
  userRoles: RoleCode[],
  isSuperAdmin: boolean
): MenuItem | null => {
  for (const item of menus) {
    if (hasMenuPermission(item, userPermissions, userRoles, isSuperAdmin)) {
      // 如果有子菜单，返回第一个可访问的子菜单
      if (item.children && item.children.length > 0) {
        const firstChild = getFirstAccessibleMenu(item.children, userPermissions, userRoles, isSuperAdmin);
        return firstChild || item;
      }
      return item;
    }
  }

  return null;
};
