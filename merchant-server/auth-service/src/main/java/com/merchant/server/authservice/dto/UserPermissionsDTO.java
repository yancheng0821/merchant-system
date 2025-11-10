package com.merchant.server.authservice.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

/**
 * 用户权限DTO - 用于返回用户的所有权限信息
 */
@Data
public class UserPermissionsDTO {

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 租户ID
     */
    private Long tenantId;

    /**
     * 用户角色列表
     */
    private List<RoleDTO> roles;

    /**
     * 用户权限列表
     */
    private List<PermissionDTO> permissions;

    /**
     * 权限代码列表（简化版，用于前端快速判断）
     */
    private List<String> permissionCodes;

    /**
     * 按资源分组的权限映射
     * Key: resource (如 products, customers)
     * Value: 该资源下的所有action列表
     */
    private Map<String, List<String>> permissionMap;

    /**
     * 是否是超级管理员
     */
    private Boolean isSuperAdmin;
}
