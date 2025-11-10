package com.merchant.server.authservice.dto;

import lombok.Data;

/**
 * 权限DTO
 */
@Data
public class PermissionDTO {

    /**
     * 权限ID
     */
    private Long id;

    /**
     * 权限名称
     */
    private String permissionName;

    /**
     * 权限代码
     */
    private String permissionCode;

    /**
     * 显示名称
     */
    private String displayName;

    /**
     * 资源模块
     */
    private String resource;

    /**
     * 操作类型
     */
    private String action;

    /**
     * 数据范围
     */
    private String scope;

    /**
     * 资源类型
     */
    private String resourceType;

    /**
     * 描述
     */
    private String description;

    /**
     * 状态
     */
    private String status;
}
