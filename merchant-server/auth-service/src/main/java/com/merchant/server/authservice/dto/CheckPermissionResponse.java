package com.merchant.server.authservice.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * 检查权限响应DTO
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CheckPermissionResponse {

    /**
     * 是否拥有权限
     */
    private Boolean hasPermission;

    /**
     * 数据范围
     */
    private String scope;

    /**
     * 约束条件（JSON格式）
     */
    private String constraints;

    /**
     * 拒绝原因（如果没有权限）
     */
    private String reason;

    public static CheckPermissionResponse allowed(String scope, String constraints) {
        return new CheckPermissionResponse(true, scope, constraints, null);
    }

    public static CheckPermissionResponse denied(String reason) {
        return new CheckPermissionResponse(false, null, null, reason);
    }
}
