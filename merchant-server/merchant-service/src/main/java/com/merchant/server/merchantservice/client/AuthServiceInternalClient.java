package com.merchant.server.merchantservice.client;

import com.merchant.server.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

/**
 * Auth服务内部客户端 - 内部接口（无需认证）
 * 供定时任务和后台服务调用
 */
@FeignClient(name = "auth-service", contextId = "authServiceInternalClient", path = "/internal/tenants")
public interface AuthServiceInternalClient {

    /**
     * 内部接口：停用租户（商户）
     * 无需用户认证
     */
    @PutMapping("/{tenantId}/deactivate")
    ApiResponse<Void> deactivateTenant(@PathVariable("tenantId") Long tenantId);

    /**
     * 内部接口：激活租户（商户）
     * 无需用户认证
     */
    @PutMapping("/{tenantId}/activate")
    ApiResponse<Void> activateTenant(@PathVariable("tenantId") Long tenantId);
}
