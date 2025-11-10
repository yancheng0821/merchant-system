package com.merchant.server.authservice.entity;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 用户角色关联实体 - 基于现有user_roles表结构
 */
@Data
public class UserRole {

    /**
     * 关联ID
     */
    private Long id;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 角色ID
     */
    private Long roleId;

    /**
     * 租户ID（商户ID）- 扩展字段
     */
    private Long tenantId;

    /**
     * 生效开始日期 - 扩展字段
     */
    private LocalDate effectiveFrom;

    /**
     * 生效结束日期（NULL表示永久）- 扩展字段
     */
    private LocalDate effectiveTo;

    /**
     * 是否主角色 - 扩展字段
     */
    private Boolean isPrimary;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间 - 扩展字段
     */
    private LocalDateTime updatedAt;

    /**
     * 创建人ID - 扩展字段
     */
    private Long createdBy;

    /**
     * 检查角色是否有效
     */
    public boolean isEffective() {
        LocalDate now = LocalDate.now();
        boolean afterStart = effectiveFrom == null || !now.isBefore(effectiveFrom);
        boolean beforeEnd = effectiveTo == null || !now.isAfter(effectiveTo);
        return afterStart && beforeEnd;
    }
}