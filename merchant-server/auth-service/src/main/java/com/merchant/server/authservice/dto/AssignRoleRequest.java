package com.merchant.server.authservice.dto;

import com.fasterxml.jackson.annotation.JsonSetter;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 分配角色请求DTO
 */
@Data
public class AssignRoleRequest {

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 角色ID列表
     */
    private List<Long> roleIds;

    /**
     * 租户ID
     */
    private Long tenantId;

    /**
     * 生效开始日期
     */
    private LocalDate effectiveFrom;

    /**
     * 生效结束日期
     */
    private LocalDate effectiveTo;

    /**
     * 主角色ID（可选）
     */
    private Long primaryRoleId;

    /**
     * 设置角色ID列表，处理 Integer 到 Long 的类型转换
     */
    @JsonSetter("roleIds")
    public void setRoleIds(List<?> rawRoleIds) {
        if (rawRoleIds == null) {
            this.roleIds = null;
            return;
        }

        this.roleIds = rawRoleIds.stream()
            .map(obj -> {
                if (obj instanceof Number) {
                    return ((Number) obj).longValue();
                }
                return Long.parseLong(obj.toString());
            })
            .collect(Collectors.toList());
    }
}
