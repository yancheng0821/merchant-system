package com.merchant.server.merchantservice.client;

import com.merchant.server.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

/**
 * Auth服务客户端 - 外部接口（需要认证）
 */
@FeignClient(name = "auth-service", contextId = "authServiceTenantClient", path = "/api/auth/tenants")
public interface AuthServiceClient {

    /**
     * 停用租户（商户）
     * 需要用户认证和SUPER_ADMIN权限
     */
    @PutMapping("/{tenantId}/deactivate")
    ApiResponse<Void> deactivateTenant(@PathVariable("tenantId") Long tenantId);

    /**
     * 激活租户（商户）
     * 需要用户认证和SUPER_ADMIN权限
     */
    @PutMapping("/{tenantId}/activate")
    ApiResponse<Void> activateTenant(@PathVariable("tenantId") Long tenantId);
}
