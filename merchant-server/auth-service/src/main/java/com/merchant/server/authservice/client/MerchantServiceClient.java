package com.merchant.server.authservice.client;

import com.merchant.server.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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

    /**
     * 删除商户（补偿操作）
     */
    @DeleteMapping("/api/merchant/{merchantId}")
    ApiResponse<Void> deleteMerchant(@PathVariable("merchantId") Long merchantId);

    /**
     * 根据租户ID获取商户信息
     */
    @GetMapping("/api/merchant/tenant/{tenantId}")
    ApiResponse<Map<String, Object>> getMerchantByTenantId(@PathVariable("tenantId") Long tenantId);

    /**
     * 为新注册的租户创建免费试用订阅
     */
    @PostMapping("/api/merchant/subscription/tenant/{tenantId}/free-trial")
    ApiResponse<Map<String, Object>> createFreeTrialSubscription(@PathVariable("tenantId") Long tenantId);

    /**
     * 获取租户的订阅状态（用于登录时检查订阅是否过期）
     */
    @GetMapping("/api/merchant/subscription/tenant/{tenantId}/status")
    ApiResponse<Map<String, Object>> getSubscriptionStatus(@PathVariable("tenantId") Long tenantId);
}