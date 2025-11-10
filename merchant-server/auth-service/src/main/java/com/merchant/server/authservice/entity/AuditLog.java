package com.merchant.server.authservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 操作审计日志实体
 * Audit Log Entity
 */
@Data
public class AuditLog {

    /**
     * 日志ID
     */
    private Long id;

    /**
     * 操作用户ID
     */
    private Long userId;

    /**
     * 租户ID
     */
    private Long tenantId;

    /**
     * 操作资源
     */
    private String resource;

    /**
     * 操作类型
     */
    private String action;

    /**
     * 资源ID
     */
    private Long resourceId;

    /**
     * 修改前的值 (JSON)
     */
    private String oldValue;

    /**
     * 修改后的值 (JSON)
     */
    private String newValue;

    /**
     * IP地址
     */
    private String ipAddress;

    /**
     * 用户代理
     */
    private String userAgent;

    /**
     * 状态: success, failed, denied
     */
    private String status;

    /**
     * 错误信息
     */
    private String errorMessage;

    /**
     * 创建时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private LocalDateTime createdAt;

    /**
     * 操作状态枚举
     */
    public enum Status {
        SUCCESS("success"),
        FAILED("failed"),
        DENIED("denied");

        private final String value;

        Status(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }
    }

    /**
     * 获取旧值Map
     */
    public Map<String, Object> getOldValueMap() {
        return jsonToMap(oldValue);
    }

    /**
     * 设置旧值Map
     */
    public void setOldValueMap(Map<String, Object> map) {
        this.oldValue = mapToJson(map);
    }

    /**
     * 获取新值Map
     */
    public Map<String, Object> getNewValueMap() {
        return jsonToMap(newValue);
    }

    /**
     * 设置新值Map
     */
    public void setNewValueMap(Map<String, Object> map) {
        this.newValue = mapToJson(map);
    }

    private Map<String, Object> jsonToMap(String json) {
        if (json == null || json.isEmpty()) {
            return new HashMap<>();
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    private String mapToJson(Map<String, Object> map) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.writeValueAsString(map);
        } catch (Exception e) {
            return "{}";
        }
    }
}
