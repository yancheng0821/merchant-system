package com.merchant.server.authservice.dto;

import com.fasterxml.jackson.annotation.JsonSetter;
import lombok.Data;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 分配权限请求DTO
 */
@Data
public class AssignPermissionsRequest {

    /**
     * 角色ID
     */
    private Long roleId;

    /**
     * 权限ID列表
     */
    private List<Long> permissionIds;

    /**
     * 设置权限ID列表，处理 Integer 到 Long 的类型转换
     */
    @JsonSetter("permissionIds")
    public void setPermissionIds(List<?> rawPermissionIds) {
        if (rawPermissionIds == null) {
            this.permissionIds = null;
            return;
        }

        this.permissionIds = rawPermissionIds.stream()
            .map(obj -> {
                if (obj instanceof Number) {
                    return ((Number) obj).longValue();
                }
                return Long.parseLong(obj.toString());
            })
            .collect(Collectors.toList());
    }
}
