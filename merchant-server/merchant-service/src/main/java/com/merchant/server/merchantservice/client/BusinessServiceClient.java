package com.merchant.server.merchantservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Business Service Feign Client
 */
@FeignClient(name = "business-service", path = "/api/business")
public interface BusinessServiceClient {

    /**
     * Clear merchant name cache in business-service
     */
    @DeleteMapping("/cache/merchant-name/{tenantId}")
    void clearMerchantNameCache(@PathVariable("tenantId") Long tenantId);
}
