package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.service.StaffNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/**
 * 测试控制器 - 用于手动触发定时任务测试
 */
@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Slf4j
public class TestController {

    private final StaffNotificationService staffNotificationService;

    /**
     * 手动触发员工每日汇总测试
     */
    @PostMapping("/staff-daily-summary")
    public Map<String, Object> triggerStaffDailySummary(
            @RequestParam Long tenantId,
            @RequestParam String date) {

        log.info("Manual trigger: staff daily summary for tenant {} on date {}", tenantId, date);

        Map<String, Object> result = new HashMap<>();
        try {
            LocalDate targetDate = LocalDate.parse(date);

            // 直接调用公共方法
            staffNotificationService.sendDailySummaryForTenantAndDate(tenantId, targetDate);

            result.put("success", true);
            result.put("message", "Daily summary triggered for tenant " + tenantId + " on " + date);
        } catch (Exception e) {
            log.error("Error triggering staff daily summary", e);
            result.put("success", false);
            result.put("message", "Error: " + e.getMessage());
        }

        return result;
    }
}
