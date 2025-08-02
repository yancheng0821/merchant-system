package com.merchant.server.authservice.client;

import com.merchant.server.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "merchant-service")
public interface MerchantServiceClient {
    
    /**
     * 创建商户
     */
    @PostMapping("/api/merchant")
    ApiResponse<Map<String, Object>> createMerchant(@RequestBody Map<String, Object> merchantData);
    
    /**
     * 批量创建商户设置
     */
    @PostMapping("/api/merchant/config/{tenantId}/batch")
    ApiResponse<Void> createMerchantSettings(@PathVariable("tenantId") Long tenantId, 
                                           @RequestBody Map<String, Object> settingsData);
}