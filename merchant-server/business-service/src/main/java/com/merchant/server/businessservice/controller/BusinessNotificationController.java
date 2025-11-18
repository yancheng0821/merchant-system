package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.entity.BusinessNotification;
import com.merchant.server.businessservice.service.BusinessNotificationService;
import com.merchant.server.businessservice.service.StaffNotificationService;
import com.merchant.server.common.annotation.Auditable;
import com.merchant.server.common.annotation.RequiresPermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 业务通知控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/business/notifications")
@RequiredArgsConstructor
@RequiresPermission("notifications:view")
public class BusinessNotificationController {

    private final BusinessNotificationService notificationService;
    private final StaffNotificationService staffNotificationService;
    
    /**
     * 获取最近的通知
     */
    @GetMapping("/recent")
    public ResponseEntity<List<BusinessNotification>> getRecentNotifications(
            @RequestParam Long tenantId,
            @RequestParam(required = false, defaultValue = "10") Integer limit) {
        try {
            List<BusinessNotification> notifications = notificationService.getRecentNotifications(tenantId, limit);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Error getting recent notifications", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 获取未读通知数量
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Integer> getUnreadCount(@RequestParam Long tenantId) {
        try {
            Integer count = notificationService.getUnreadCount(tenantId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            log.error("Error getting unread count", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 获取指定时间后的通知
     */
    @GetMapping("/after")
    public ResponseEntity<List<BusinessNotification>> getNotificationsAfter(
            @RequestParam Long tenantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime afterTime) {
        try {
            List<BusinessNotification> notifications = notificationService.getNotificationsAfter(tenantId, afterTime);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Error getting notifications after time", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 标记通知为已读
     */
    @RequiresPermission("notifications:update")
    @PostMapping("/mark-read")
    public ResponseEntity<Void> markAsRead(
            @RequestParam Long tenantId,
            @RequestBody List<Long> notificationIds) {
        try {
            notificationService.markAsRead(tenantId, notificationIds);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error marking notifications as read", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 获取通知概览（用于Dashboard）
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardNotifications(@RequestParam Long tenantId) {
        try {
            Map<String, Object> result = new HashMap<>();
            
            // 获取最近10条通知
            List<BusinessNotification> recentNotifications = notificationService.getRecentNotifications(tenantId, 10);
            result.put("notifications", recentNotifications);
            
            // 获取未读数量
            Integer unreadCount = notificationService.getUnreadCount(tenantId);
            result.put("unreadCount", unreadCount);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error getting dashboard notifications", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 手动触发员工每日汇总邮件
     * 可以指定日期，如果不指定则默认为今天
     */
    @RequiresPermission("notifications:send")
    @PostMapping("/staff-daily-summary/trigger")
    public ResponseEntity<Map<String, Object>> triggerStaffDailySummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            LocalDate targetDate = date != null ? date : LocalDate.now();
            log.debug("Manually triggering staff daily summary for date: {}", targetDate);

            staffNotificationService.sendDailySummaryForDate(targetDate);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Staff daily summary emails triggered successfully");
            result.put("date", targetDate.toString());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error triggering staff daily summary", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * 手动触发单个员工的每日汇总邮件
     */
    @Auditable(resource = "STAFF_NOTIFICATION", action = "SEND_SUMMARY", resourceIdParam = "staffId", recordOldValue = false, description = "Send staff attendance summary email")
    @RequiresPermission("schedule:send_summary")
    @PostMapping("/staff-daily-summary/trigger-single")
    public ResponseEntity<Map<String, Object>> triggerSingleStaffDailySummary(
            @RequestParam Long staffId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            LocalDate targetDate = date != null ? date : LocalDate.now();
            log.debug("Manually triggering daily summary for staff {} on date: {}", staffId, targetDate);

            staffNotificationService.sendDailySummaryForSingleStaff(staffId, targetDate);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Staff daily summary email sent successfully");
            result.put("staffId", staffId);
            result.put("date", targetDate.toString());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error triggering single staff daily summary for staff {}", staffId, e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}