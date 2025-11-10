package com.merchant.server.authservice.service;

import com.merchant.server.authservice.dto.CheckPermissionResponse;
import com.merchant.server.authservice.dto.UserPermissionsDTO;

/**
 * 授权服务接口 - 核心权限检查服务
 */
public interface AuthorizationService {

    /**
     * 检查用户是否拥有指定权限
     * @param userId 用户ID
     * @param tenantId 租户ID
     * @param resource 资源模块
     * @param action 操作类型
     * @return 权限检查结果
     */
    CheckPermissionResponse checkPermission(Long userId, Long tenantId, String resource, String action);

    /**
     * 检查用户是否拥有指定权限（通过权限代码）
     * @param userId 用户ID
     * @param tenantId 租户ID
     * @param permissionCode 权限代码 (如: products:create)
     * @return 权限检查结果
     */
    CheckPermissionResponse checkPermissionByCode(Long userId, Long tenantId, String permissionCode);

    /**
     * 获取用户的所有权限信息
     * @param userId 用户ID
     * @param tenantId 租户ID
     * @return 用户权限DTO
     */
    UserPermissionsDTO getUserPermissions(Long userId, Long tenantId);

    /**
     * 检查用户是否是超级管理员
     * @param userId 用户ID
     * @param tenantId 租户ID
     * @return 是否超级管理员
     */
    boolean isSuperAdmin(Long userId, Long tenantId);

    /**
     * 检查用户是否拥有指定角色
     * @param userId 用户ID
     * @param roleCode 角色代码
     * @param tenantId 租户ID
     * @return 是否拥有角色
     */
    boolean hasRole(Long userId, String roleCode, Long tenantId);

    /**
     * 检查用户角色层级是否足够（用于判断是否可以操作其他用户）
     * @param operatorUserId 操作者用户ID
     * @param targetUserId 目标用户ID
     * @param tenantId 租户ID
     * @return 是否有足够权限
     */
    boolean hasHigherRoleLevel(Long operatorUserId, Long targetUserId, Long tenantId);

    /**
     * 刷新用户权限缓存
     * @param userId 用户ID
     * @param tenantId 租户ID
     */
    void refreshUserPermissions(Long userId, Long tenantId);
}
