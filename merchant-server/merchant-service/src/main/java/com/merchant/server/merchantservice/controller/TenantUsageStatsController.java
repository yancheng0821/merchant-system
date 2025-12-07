package com.merchant.server.merchantservice.controller;

import com.merchant.server.common.dto.ApiResponse;
import com.merchant.server.merchantservice.entity.TenantUsageStats;
import com.merchant.server.merchantservice.service.TenantUsageStatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 租户使用量统计控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/merchant/usage-stats")
@RequiredArgsConstructor
public class TenantUsageStatsController {

    private final TenantUsageStatsService tenantUsageStatsService;

    /**
     * 获取当月使用量统计
     */
    @GetMapping("/tenant/{tenantId}/current")
    public ResponseEntity<ApiResponse<TenantUsageStats>> getCurrentMonthStats(@PathVariable Long tenantId) {
        log.info("获取当月使用量统计 - 租户ID: {}", tenantId);
        try {
            TenantUsageStats stats = tenantUsageStatsService.getCurrentMonthStats(tenantId);
            return ResponseEntity.ok(ApiResponse.success(stats));
        } catch (Exception e) {
            log.error("获取当月使用量统计失败 - 租户ID: {}", tenantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("获取使用量统计失败: " + e.getMessage()));
        }
    }

    /**
     * 获取指定月份使用量统计
     */
    @GetMapping("/tenant/{tenantId}/month/{statMonth}")
    public ResponseEntity<ApiResponse<TenantUsageStats>> getStatsByMonth(
            @PathVariable Long tenantId,
            @PathVariable String statMonth) {
        log.info("获取指定月份使用量统计 - 租户ID: {}, 月份: {}", tenantId, statMonth);
        try {
            TenantUsageStats stats = tenantUsageStatsService.getStatsByMonth(tenantId, statMonth);
            return ResponseEntity.ok(ApiResponse.success(stats));
        } catch (Exception e) {
            log.error("获取指定月份使用量统计失败 - 租户ID: {}, 月份: {}", tenantId, statMonth, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("获取使用量统计失败: " + e.getMessage()));
        }
    }

    /**
     * 增加预约计数（供 business-service 内部调用）
     */
    @PostMapping("/tenant/{tenantId}/increment/appointment")
    public ResponseEntity<ApiResponse<Void>> incrementAppointmentCount(@PathVariable Long tenantId) {
        log.debug("增加预约计数 - 租户ID: {}", tenantId);
        try {
            tenantUsageStatsService.incrementAppointmentCount(tenantId);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            log.error("增加预约计数失败 - 租户ID: {}", tenantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("增加预约计数失败: " + e.getMessage()));
        }
    }

    /**
     * 增加邮件计数（供 notification-service 内部调用）
     */
    @PostMapping("/tenant/{tenantId}/increment/email")
    public ResponseEntity<ApiResponse<Void>> incrementEmailCount(@PathVariable Long tenantId) {
        log.debug("增加邮件计数 - 租户ID: {}", tenantId);
        try {
            tenantUsageStatsService.incrementEmailCount(tenantId);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            log.error("增加邮件计数失败 - 租户ID: {}", tenantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("增加邮件计数失败: " + e.getMessage()));
        }
    }

    /**
     * 增加短信计数（供 notification-service 内部调用）
     */
    @PostMapping("/tenant/{tenantId}/increment/sms")
    public ResponseEntity<ApiResponse<Void>> incrementSmsCount(@PathVariable Long tenantId) {
        log.debug("增加短信计数 - 租户ID: {}", tenantId);
        try {
            tenantUsageStatsService.incrementSmsCount(tenantId);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            log.error("增加短信计数失败 - 租户ID: {}", tenantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("增加短信计数失败: " + e.getMessage()));
        }
    }
}
