package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.entity.CustomerPackageUsageLog;
import com.merchant.server.businessservice.service.CustomerPackageUsageLogService;
import com.merchant.server.common.annotation.RequiresPermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 客户套餐使用记录Controller
 */
@Slf4j
@RestController
@RequestMapping("/api/business/package-usage")
@RequiredArgsConstructor
@RequiresPermission("packages:view")
public class CustomerPackageUsageLogController {

    private final CustomerPackageUsageLogService usageLogService;

    /**
     * 获取客户的套餐使用记录
     */
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<CustomerPackageUsageLog>> getCustomerUsageLogs(
            @PathVariable Long customerId,
            @RequestParam Long tenantId) {
        log.info("Getting usage logs for customer: {}", customerId);
        List<CustomerPackageUsageLog> logs = usageLogService.getCustomerUsageLogs(tenantId, customerId);
        return ResponseEntity.ok(logs);
    }

    /**
     * 获取指定套餐的使用记录
     */
    @GetMapping("/package/{packageId}")
    public ResponseEntity<List<CustomerPackageUsageLog>> getPackageUsageLogs(
            @PathVariable Long packageId) {
        log.info("Getting usage logs for package: {}", packageId);
        List<CustomerPackageUsageLog> logs = usageLogService.getPackageUsageLogs(packageId);
        return ResponseEntity.ok(logs);
    }

    /**
     * 获取预约相关的套餐使用记录
     */
    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<List<CustomerPackageUsageLog>> getAppointmentUsageLogs(
            @PathVariable Long appointmentId) {
        log.info("Getting usage logs for appointment: {}", appointmentId);
        List<CustomerPackageUsageLog> logs = usageLogService.getAppointmentUsageLogs(appointmentId);
        return ResponseEntity.ok(logs);
    }

    /**
     * 获取指定时间范围的使用记录
     */
    @GetMapping("/customer/{customerId}/range")
    public ResponseEntity<List<CustomerPackageUsageLog>> getUsageLogsByDateRange(
            @PathVariable Long customerId,
            @RequestParam Long tenantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        log.info("Getting usage logs for customer: {} in range {} to {}", customerId, startDate, endDate);
        List<CustomerPackageUsageLog> logs = usageLogService.getUsageLogsByDateRange(
                tenantId, customerId, startDate, endDate);
        return ResponseEntity.ok(logs);
    }

    /**
     * 统计客户总使用次数
     */
    @GetMapping("/customer/{customerId}/count")
    public ResponseEntity<Integer> countCustomerUsage(
            @PathVariable Long customerId,
            @RequestParam Long tenantId) {
        log.info("Counting usage for customer: {}", customerId);
        Integer count = usageLogService.countCustomerUsage(tenantId, customerId);
        return ResponseEntity.ok(count);
    }
}
