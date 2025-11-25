package com.merchant.server.authservice.controller;

import com.merchant.server.authservice.service.TenantService;
import com.merchant.server.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * 租户内部API控制器
 * 供服务间调用，不需要用户认证
 */
@Slf4j
@RestController
@RequestMapping("/internal/tenants")
@RequiredArgsConstructor
public class InternalTenantController {

    private final TenantService tenantService;

    /**
     * 内部接口：激活租户
     * 供其他服务调用，不需要用户认证
     */
    @PutMapping("/{tenantId}/activate")
    public ApiResponse<Void> activateTenant(@PathVariable Long tenantId) {
        log.info("Internal API: Activating tenant with id: {}", tenantId);

        try {
            tenantService.activateTenant(tenantId);
            log.info("Tenant activated successfully via internal API: {}", tenantId);
            return ApiResponse.success(null);

        } catch (Exception e) {
            log.error("Error activating tenant via internal API: {}", tenantId, e);
            return ApiResponse.error("激活商户失败");
        }
    }

    /**
     * 内部接口：停用租户
     * 供其他服务调用，不需要用户认证
     */
    @PutMapping("/{tenantId}/deactivate")
    public ApiResponse<Void> deactivateTenant(@PathVariable Long tenantId) {
        log.info("Internal API: Deactivating tenant with id: {}", tenantId);

        try {
            tenantService.deactivateTenant(tenantId);
            log.info("Tenant deactivated successfully via internal API: {}", tenantId);
            return ApiResponse.success(null);

        } catch (Exception e) {
            log.error("Error deactivating tenant via internal API: {}", tenantId, e);
            return ApiResponse.error("停用商户失败");
        }
    }
}
