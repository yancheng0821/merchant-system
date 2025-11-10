package com.merchant.server.businessservice.client;

import com.merchant.server.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;

/**
 * Merchant Service Feign Client
 */
@FeignClient(name = "merchant-service", path = "/api/merchant")
public interface MerchantServiceClient {

    /**
     * Get merchant configuration
     */
    @GetMapping("/config/{tenantId}")
    Map<String, Object> getMerchantConfig(@PathVariable("tenantId") Long tenantId);

    /**
     * Get merchant information by tenant ID
     */
    @GetMapping("/{tenantId}")
    ApiResponse<Map<String, Object>> getMerchantByTenantId(@PathVariable("tenantId") Long tenantId);
}
