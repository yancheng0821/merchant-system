package com.merchant.server.businessservice.client;

import com.merchant.server.businessservice.dto.AppointmentNotificationDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@Slf4j
public class NotificationClient {

    private final RestTemplate restTemplate;
    private final String notificationServiceUrl;

    public NotificationClient(RestTemplate restTemplate, 
                            @Value("${notification.service.url:http://notification-service}") String notificationServiceUrl) {
        this.restTemplate = restTemplate;
        this.notificationServiceUrl = notificationServiceUrl;
    }

    public void sendAppointmentConfirmation(AppointmentNotificationDTO notification) {
        try {
            log.info("Sending appointment confirmation notification for appointment: {}", notification.getAppointmentId());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<AppointmentNotificationDTO> request = new HttpEntity<>(notification, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(
                notificationServiceUrl + "/api/v2/appointment-notifications/confirmation",
                request,
                String.class
            );
            
            log.info("Appointment confirmation notification sent successfully: {}", response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to send appointment confirmation notification for appointment: {}, error: {}", 
                notification.getAppointmentId(), e.getMessage());
            // 降级处理：记录到数据库或消息队列，稍后重试
            handleNotificationFailure("confirmation", notification, e);
        }
    }

    public void sendAppointmentCancellation(AppointmentNotificationDTO notification) {
        try {
            log.info("Sending appointment cancellation notification for appointment: {}", notification.getAppointmentId());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<AppointmentNotificationDTO> request = new HttpEntity<>(notification, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(
                notificationServiceUrl + "/api/v2/appointment-notifications/cancellation",
                request,
                String.class
            );
            
            log.info("Appointment cancellation notification sent successfully: {}", response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to send appointment cancellation notification for appointment: {}, error: {}", 
                notification.getAppointmentId(), e.getMessage());
            handleNotificationFailure("cancellation", notification, e);
        }
    }

    public void sendAppointmentCompletion(AppointmentNotificationDTO notification) {
        try {
            log.info("Sending appointment completion notification for appointment: {}", notification.getAppointmentId());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<AppointmentNotificationDTO> request = new HttpEntity<>(notification, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(
                notificationServiceUrl + "/api/v2/appointment-notifications/completion",
                request,
                String.class
            );
            
            log.info("Appointment completion notification sent successfully: {}", response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to send appointment completion notification for appointment: {}, error: {}", 
                notification.getAppointmentId(), e.getMessage());
            handleNotificationFailure("completion", notification, e);
        }
    }

    public void sendAppointmentReminder(AppointmentNotificationDTO notification) {
        try {
            log.info("Sending appointment reminder notification for appointment: {}", notification.getAppointmentId());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<AppointmentNotificationDTO> request = new HttpEntity<>(notification, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(
                notificationServiceUrl + "/api/v2/appointment-notifications/reminder",
                request,
                String.class
            );
            
            log.info("Appointment reminder notification sent successfully: {}", response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to send appointment reminder notification for appointment: {}, error: {}", 
                notification.getAppointmentId(), e.getMessage());
            handleNotificationFailure("reminder", notification, e);
        }
    }
    
    /**
     * 处理通知发送失败的情况
     * 只记录错误日志，不影响预约创建流程
     */
    private void handleNotificationFailure(String notificationType, AppointmentNotificationDTO notification, Exception e) {
        log.error("❌ 通知服务不可用，通知发送失败。预约创建不受影响。" +
                "通知类型: {}, 预约ID: {}, 客户: {}, 错误: {}", 
                notificationType, 
                notification.getAppointmentId(), 
                notification.getCustomerName(),
                e.getMessage());
        
        // 记录详细的通知信息用于后续处理
        log.info("📋 失败的通知详情 - 预约ID: {}, 客户: {}, 手机: {}, 邮箱: {}, 偏好: {}", 
                notification.getAppointmentId(),
                notification.getCustomerName(),
                notification.getCustomerPhone(),
                notification.getCustomerEmail(),
                notification.getCommunicationPreference());
        
        // 可以在这里实现其他处理策略：
        // 1. 保存到数据库待稍后重试
        // 2. 发送到消息队列
        // 3. 发送告警给运维人员
        
        // 但不进行本地降级处理，确保预约创建流程不受影响
    }
}