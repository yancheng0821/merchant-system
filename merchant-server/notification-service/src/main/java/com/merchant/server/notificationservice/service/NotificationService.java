package com.merchant.server.notificationservice.service;

import com.merchant.server.notificationservice.dto.SendNotificationRequest;
import com.merchant.server.notificationservice.entity.NotificationLog;
import com.merchant.server.notificationservice.entity.NotificationTemplate;

import java.util.List;

public interface NotificationService {
    
    /**
     * 发送通知
     */
    NotificationLog sendNotification(SendNotificationRequest request);
    
    /**
     * 批量发送通知
     */
    List<NotificationLog> sendBatchNotifications(List<SendNotificationRequest> requests);
    
    /**
     * 重试失败的通知
     */
    void retryFailedNotifications();
    
    /**
     * 根据业务ID查询通知日志
     */
    List<NotificationLog> getNotificationsByBusinessId(String businessId);
    
    /**
     * 根据租户ID查询通知日志
     */
    List<NotificationLog> getNotificationsByTenantId(Long tenantId, int page, int size);
    
    /**
     * 根据租户ID和筛选条件查询通知日志
     */
    List<NotificationLog> getNotificationsByTenantIdWithFilters(Long tenantId, int page, int size, 
        String templateCode, String type, String status, String recipient, String businessId);
}