package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.entity.BusinessNotification;
import com.merchant.server.businessservice.service.SystemNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 系统通知管理Controller
 */
@Slf4j
@RestController
@RequestMapping("/api/business/notifications/system")
@RequiredArgsConstructor
public class SystemNotificationController {

    private final SystemNotificationService systemNotificationService;

    /**
     * 获取所有系统通知（全局，tenantId=null）
     */
    @GetMapping
    public ResponseEntity<List<BusinessNotification>> getAllSystemNotifications() {
        log.info("Fetching all system notifications");
        List<BusinessNotification> notifications = systemNotificationService.getAllSystemNotifications();
        return ResponseEntity.ok(notifications);
    }

    /**
     * 获取租户的系统通知副本（用于前端顶部通知栏显示）
     */
    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<BusinessNotification>> getTenantSystemNotifications(@PathVariable Long tenantId) {
        log.info("Fetching system notifications for tenant: {}", tenantId);
        List<BusinessNotification> notifications = systemNotificationService.getTenantSystemNotifications(tenantId);
        return ResponseEntity.ok(notifications);
    }

    /**
     * 创建系统通知（全局，应用于所有租户）
     */
    @PostMapping
    public ResponseEntity<BusinessNotification> createSystemNotification(@RequestBody BusinessNotification notification) {
        log.info("Creating system notification: {}", notification.getTitleEn());
        BusinessNotification created = systemNotificationService.createSystemNotification(notification);
        return ResponseEntity.ok(created);
    }

    /**
     * 更新系统通知
     */
    @PutMapping("/{id}")
    public ResponseEntity<BusinessNotification> updateSystemNotification(
            @PathVariable Long id,
            @RequestBody BusinessNotification notification) {
        log.info("Updating system notification ID: {}", id);
        notification.setId(id);
        BusinessNotification updated = systemNotificationService.updateSystemNotification(notification);
        return ResponseEntity.ok(updated);
    }

    /**
     * 删除系统通知
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSystemNotification(@PathVariable Long id) {
        log.info("Deleting system notification ID: {}", id);
        systemNotificationService.deleteSystemNotification(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 为新租户初始化系统通知副本
     * 在商户注册时调用
     */
    @PostMapping("/init-for-tenant/{tenantId}")
    public ResponseEntity<Void> initSystemNotificationCopiesForNewTenant(@PathVariable Long tenantId) {
        log.info("Initializing system notification copies for new tenant: {}", tenantId);
        systemNotificationService.initSystemNotificationCopiesForNewTenant(tenantId);
        return ResponseEntity.ok().build();
    }
}
