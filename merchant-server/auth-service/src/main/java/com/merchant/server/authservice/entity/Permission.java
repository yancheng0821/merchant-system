package com.merchant.server.authservice.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 权限实体 - 基于现有permissions表结构
 */
@Data
public class Permission {

    /**
     * 权限ID
     */
    private Long id;

    /**
     * 权限名称
     */
    private String permissionName;

    /**
     * 权限代码 (如: customers:view)
     */
    private String permissionCode;

    /**
     * 资源类型
     */
    private String resourceType;

    /**
     * 所属模块 (如: access_control, settings)
     */
    private String module;

    /**
     * 资源模块 (扩展字段，从permissionCode解析)
     */
    private String resource;

    /**
     * 操作类型 (扩展字段，从permissionCode解析)
     */
    private String action;

    /**
     * 数据范围: all, own, team (扩展字段)
     */
    private String scope;

    /**
     * 显示名称 (扩展字段)
     */
    private String displayName;

    /**
     * 资源路径
     */
    private String resourcePath;

    /**
     * HTTP方法
     */
    private String httpMethod;

    /**
     * 描述
     */
    private String description;

    /**
     * 状态
     */
    private PermissionStatus status;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;

    public enum PermissionStatus {
        ACTIVE, INACTIVE
    }

    /**
     * 从permissionCode解析resource和action
     */
    public void parsePermissionCode() {
        if (permissionCode != null && permissionCode.contains(":")) {
            String[] parts = permissionCode.split(":");
            this.resource = parts[0];
            this.action = parts.length > 1 ? parts[1] : "view";
        }
    }
}
