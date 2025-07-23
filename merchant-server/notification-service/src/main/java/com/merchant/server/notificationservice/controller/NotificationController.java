package com.merchant.server.notificationservice.controller;

import com.merchant.server.notificationservice.dto.SendNotificationRequest;
import com.merchant.server.notificationservice.entity.NotificationLog;
import com.merchant.server.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/notification")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * 发送单个通知
     */
    @PostMapping("/send")
    public ResponseEntity<NotificationLog> sendNotification(@Valid @RequestBody SendNotificationRequest request) {
        log.info("Sending notification: {} to {}", request.getTemplateCode(), request.getRecipient());
        NotificationLog result = notificationService.sendNotification(request);
        return ResponseEntity.ok(result);
    }

    /**
     * 批量发送通知
     */
    @PostMapping("/send/batch")
    public ResponseEntity<List<NotificationLog>> sendBatchNotifications(@Valid @RequestBody List<SendNotificationRequest> requests) {
        log.info("Sending batch notifications, count: {}", requests.size());
        List<NotificationLog> results = notificationService.sendBatchNotifications(requests);
        return ResponseEntity.ok(results);
    }

    /**
     * 根据业务ID查询通知日志
     */
    @GetMapping("/logs/business/{businessId}")
    public ResponseEntity<List<NotificationLog>> getNotificationsByBusinessId(@PathVariable String businessId) {
        log.info("Getting notifications for business ID: {}", businessId);
        List<NotificationLog> logs = notificationService.getNotificationsByBusinessId(businessId);
        return ResponseEntity.ok(logs);
    }

    /**
     * 根据租户ID查询通知日志
     */
    @GetMapping("/logs")
    public ResponseEntity<List<NotificationLog>> getNotificationsByTenant(
            @RequestParam Long tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String templateCode,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String recipient,
            @RequestParam(required = false) String businessId) {
        log.info("Getting notifications for tenant: {}, page: {}, size: {}", tenantId, page, size);
        List<NotificationLog> logs = notificationService.getNotificationsByTenantIdWithFilters(
            tenantId, page, size, templateCode, type, status, recipient, businessId);
        return ResponseEntity.ok(logs);
    }

    /**
     * 重试失败的通知
     */
    @PostMapping("/retry")
    public ResponseEntity<Void> retryFailedNotifications() {
        log.info("Retrying failed notifications");
        notificationService.retryFailedNotifications();
        return ResponseEntity.ok().build();
    }
}