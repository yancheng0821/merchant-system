package com.merchant.server.businessservice.client;

import com.merchant.server.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

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

    /**
     * 检查租户是否有特定功能
     * @param tenantId 租户ID
     * @param feature 功能代码（如: customerImport, smsNotification）
     * @return 是否有该功能
     */
    @GetMapping("/subscription/tenant/{tenantId}/features/{feature}/check")
    ApiResponse<Boolean> checkTenantFeature(
            @PathVariable("tenantId") Long tenantId,
            @PathVariable("feature") String feature);

    /**
     * 获取租户的功能配置JSON
     * @param tenantId 租户ID
     * @return 功能配置JSON字符串
     */
    @GetMapping("/subscription/tenant/{tenantId}/features")
    ApiResponse<String> getTenantFeatures(@PathVariable("tenantId") Long tenantId);

    /**
     * 获取租户的员工数量限制
     * @param tenantId 租户ID
     * @return maxStaff 限制，-1表示无限制
     */
    @GetMapping("/subscription/tenant/{tenantId}/limits/maxStaff")
    ApiResponse<Integer> getTenantMaxStaff(@PathVariable("tenantId") Long tenantId);

    /**
     * 获取租户的月预约数量限制
     * @param tenantId 租户ID
     * @return maxAppointmentsPerMonth 限制，-1表示无限制
     */
    @GetMapping("/subscription/tenant/{tenantId}/limits/maxAppointmentsPerMonth")
    ApiResponse<Integer> getTenantMaxAppointmentsPerMonth(@PathVariable("tenantId") Long tenantId);

    /**
     * 获取租户当月使用量统计
     * @param tenantId 租户ID
     * @return 使用量统计
     */
    @GetMapping("/usage-stats/tenant/{tenantId}/current")
    ApiResponse<java.util.Map<String, Object>> getCurrentMonthStats(@PathVariable("tenantId") Long tenantId);

    /**
     * 增加租户预约计数
     * @param tenantId 租户ID
     */
    @PostMapping("/usage-stats/tenant/{tenantId}/increment/appointment")
    ApiResponse<Void> incrementAppointmentCount(@PathVariable("tenantId") Long tenantId);
}
