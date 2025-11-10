package com.merchant.server.authservice.dto;

import lombok.Data;
import java.util.List;

/**
 * 角色DTO
 */
@Data
public class RoleDTO {

    /**
     * 角色ID
     */
    private Long id;

    /**
     * 租户ID
     */
    private Long tenantId;

    /**
     * 角色名称
     */
    private String roleName;

    /**
     * 角色代码
     */
    private String roleCode;

    /**
     * 显示名称
     */
    private String displayName;

    /**
     * 描述
     */
    private String description;

    /**
     * 层级
     */
    private Integer level;

    /**
     * 是否系统角色
     */
    private Boolean isSystem;

    /**
     * 状态
     */
    private String status;

    /**
     * 权限列表
     */
    private List<PermissionDTO> permissions;

    /**
     * 权限ID列表
     */
    private List<Long> permissionIds;
}
