package com.merchant.server.notificationservice.client;

import com.merchant.server.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.Map;

/**
 * Merchant Service Feign Client
 * 用于通知服务调用商户服务获取订阅限制和使用量统计
 */
@FeignClient(name = "merchant-service", path = "/api/merchant")
public interface MerchantServiceClient {

    /**
     * 获取租户的月短信数量限制
     * @param tenantId 租户ID
     * @return maxSmsPerMonth 限制，0表示不包含短信功能，-1表示无限制
     */
    @GetMapping("/subscription/tenant/{tenantId}/limits/maxSmsPerMonth")
    ApiResponse<Integer> getTenantMaxSmsPerMonth(@PathVariable("tenantId") Long tenantId);

    /**
     * 获取租户的月邮件数量限制
     * @param tenantId 租户ID
     * @return maxEmailsPerMonth 限制，-1表示无限制
     */
    @GetMapping("/subscription/tenant/{tenantId}/limits/maxEmailsPerMonth")
    ApiResponse<Integer> getTenantMaxEmailsPerMonth(@PathVariable("tenantId") Long tenantId);

    /**
     * 获取租户当月使用量统计
     * @param tenantId 租户ID
     * @return 使用量统计（包含 emailCount, smsCount 等）
     */
    @GetMapping("/usage-stats/tenant/{tenantId}/current")
    ApiResponse<Map<String, Object>> getCurrentMonthStats(@PathVariable("tenantId") Long tenantId);

    /**
     * 增加租户邮件计数
     * @param tenantId 租户ID
     */
    @PostMapping("/usage-stats/tenant/{tenantId}/increment/email")
    ApiResponse<Void> incrementEmailCount(@PathVariable("tenantId") Long tenantId);

    /**
     * 增加租户短信计数
     * @param tenantId 租户ID
     */
    @PostMapping("/usage-stats/tenant/{tenantId}/increment/sms")
    ApiResponse<Void> incrementSmsCount(@PathVariable("tenantId") Long tenantId);
}
