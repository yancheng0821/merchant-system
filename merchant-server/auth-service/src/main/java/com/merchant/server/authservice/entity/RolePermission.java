package com.merchant.server.authservice.entity;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 角色权限关联实体 - 基于现有role_permissions表结构
 */
@Data
public class RolePermission {

    /**
     * 关联ID
     */
    private Long id;

    /**
     * 角色ID
     */
    private Long roleId;

    /**
     * 权限ID
     */
    private Long permissionId;

    /**
     * 覆盖默认范围: all, own, team (扩展字段)
     */
    private String scopeOverride;

    /**
     * 约束条件 JSON (扩展字段)
     */
    private String constraints;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间 (扩展字段)
     */
    private LocalDateTime updatedAt;

    /**
     * 获取约束条件 Map
     */
    public Map<String, Object> getConstraintsMap() {
        if (constraints == null || constraints.isEmpty()) {
            return new HashMap<>();
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(constraints, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    /**
     * 设置约束条件 Map
     */
    public void setConstraintsMap(Map<String, Object> constraintsMap) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            this.constraints = mapper.writeValueAsString(constraintsMap);
        } catch (Exception e) {
            this.constraints = "{}";
        }
    }

    /**
     * 获取最大金额限制
     */
    public Double getMaxAmount() {
        Map<String, Object> map = getConstraintsMap();
        Object maxAmount = map.get("max_amount");
        if (maxAmount instanceof Number) {
            return ((Number) maxAmount).doubleValue();
        }
        return null;
    }

    /**
     * 是否需要审批
     */
    public Boolean requiresApproval() {
        Map<String, Object> map = getConstraintsMap();
        Object approval = map.get("require_approval");
        if (approval instanceof Boolean) {
            return (Boolean) approval;
        }
        return false;
    }
}
