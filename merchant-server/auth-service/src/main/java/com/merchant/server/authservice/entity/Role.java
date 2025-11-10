package com.merchant.server.authservice.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 角色实体 - 基于现有roles表结构
 */
@Data
public class Role {

    /**
     * 角色ID
     */
    private Long id;

    /**
     * 角色名称
     */
    private String roleName;

    /**
     * 角色代码: SUPER_ADMIN, MANAGER, RECEPTIONIST, STAFF, ACCOUNTANT
     */
    private String roleCode;

    /**
     * 显示名称 (扩展字段)
     */
    private String displayName;

    /**
     * 角色描述
     */
    private String description;

    /**
     * 角色层级 (扩展字段)
     */
    private Integer level;

    /**
     * 是否系统角色 (扩展字段)
     */
    private Boolean isSystem;

    /**
     * 状态
     */
    private RoleStatus status;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;

    public enum RoleStatus {
        ACTIVE, INACTIVE
    }

    /**
     * 角色类型枚举
     */
    public enum RoleType {
        SUPER_ADMIN("超级管理员", 100),
        MANAGER("店长", 80),
        ACCOUNTANT("财务", 60),
        RECEPTIONIST("前台接待", 50),
        STAFF("技师/员工", 20);

        private final String displayName;
        private final int level;

        RoleType(String displayName, int level) {
            this.displayName = displayName;
            this.level = level;
        }

        public String getDisplayName() {
            return displayName;
        }

        public int getLevel() {
            return level;
        }

        public static RoleType fromCode(String code) {
            for (RoleType type : values()) {
                if (type.name().equals(code)) {
                    return type;
                }
            }
            return null;
        }
    }
}