package com.merchant.server.authservice.dto;

import lombok.Data;

/**
 * 检查权限请求DTO
 */
@Data
public class CheckPermissionRequest {

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 租户ID
     */
    private Long tenantId;

    /**
     * 资源模块
     */
    private String resource;

    /**
     * 操作类型
     */
    private String action;

    /**
     * 或者直接使用权限代码
     */
    private String permissionCode;
}
