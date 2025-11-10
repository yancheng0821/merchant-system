package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.client.NotificationClient;
import com.merchant.server.businessservice.dto.AppointmentNotificationDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * 通知服务封装类
 * 提供统一的通知发送接口，处理异常和降级逻辑
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationClient notificationClient;

    /**
     * 发送预约确认通知
     */
    public void sendAppointmentConfirmation(AppointmentNotificationDTO notification) {
        try {
            log.info("Sending appointment confirmation notification for appointment: {}", notification.getAppointmentId());
            notificationClient.sendAppointmentConfirmation(notification);
            log.info("Appointment confirmation notification sent successfully");
        } catch (Exception e) {
            log.error("Failed to send appointment confirmation notification for appointment: {}, error: {}",
                    notification.getAppointmentId(), e.getMessage());
            handleNotificationFailure("confirmation", notification, e);
        }
    }

    /**
     * 发送预约取消通知
     */
    public void sendAppointmentCancellation(AppointmentNotificationDTO notification) {
        try {
            log.info("Sending appointment cancellation notification for appointment: {}", notification.getAppointmentId());
            notificationClient.sendAppointmentCancellation(notification);
            log.info("Appointment cancellation notification sent successfully");
        } catch (Exception e) {
            log.error("Failed to send appointment cancellation notification for appointment: {}, error: {}",
                    notification.getAppointmentId(), e.getMessage());
            handleNotificationFailure("cancellation", notification, e);
        }
    }

    /**
     * 发送预约完成通知
     */
    public void sendAppointmentCompletion(AppointmentNotificationDTO notification) {
        try {
            log.info("Sending appointment completion notification for appointment: {}", notification.getAppointmentId());
            notificationClient.sendAppointmentCompletion(notification);
            log.info("Appointment completion notification sent successfully");
        } catch (Exception e) {
            log.error("Failed to send appointment completion notification for appointment: {}, error: {}",
                    notification.getAppointmentId(), e.getMessage());
            handleNotificationFailure("completion", notification, e);
        }
    }

    /**
     * 发送预约提醒通知
     */
    public void sendAppointmentReminder(AppointmentNotificationDTO notification) {
        try {
            log.info("Sending appointment reminder notification for appointment: {}", notification.getAppointmentId());
            notificationClient.sendAppointmentReminder(notification);
            log.info("Appointment reminder notification sent successfully");
        } catch (Exception e) {
            log.error("Failed to send appointment reminder notification for appointment: {}, error: {}",
                    notification.getAppointmentId(), e.getMessage());
            handleNotificationFailure("reminder", notification, e);
        }
    }

    /**
     * 发送短信（通用方法）
     */
    public boolean sendSms(String phoneNumber, String message) {
        return sendSms(phoneNumber, message, null, null, null, null);
    }

    public boolean sendSms(String phoneNumber, String message, Long tenantId, String businessType, String businessId) {
        return sendSms(phoneNumber, message, tenantId, businessType, businessId, null);
    }

    public boolean sendSms(String phoneNumber, String message, Long tenantId, String businessType, String businessId, String businessScenario) {
        try {
            log.info("Sending SMS to: {}, tenantId: {}, businessType: {}, businessScenario: {}",
                    phoneNumber, tenantId, businessType, businessScenario);

            // 构建请求体
            Map<String, Object> request = new HashMap<>();
            request.put("phoneNumber", phoneNumber);
            request.put("content", message);
            if (tenantId != null) {
                request.put("tenantId", tenantId);
            }
            if (businessType != null) {
                request.put("businessType", businessType);
            }
            if (businessId != null) {
                request.put("businessId", businessId);
            }
            if (businessScenario != null) {
                request.put("businessScenario", businessScenario);
            }

            Map<String, Object> response = notificationClient.sendSms(request);

            if (response != null && Boolean.TRUE.equals(response.get("success"))) {
                log.info("SMS sent successfully: {}", phoneNumber);
                return true;
            }

            log.warn("SMS sending failed for: {}", phoneNumber);
            return false;
        } catch (Exception e) {
            log.error("Failed to send SMS to: {}, error: {}", phoneNumber, e.getMessage());
            return false;
        }
    }

    /**
     * 发送模板化邮件
     * 用于员工通知等场景
     */
    public void sendTemplatedEmail(
            String toEmail,
            String templateCode,
            Map<String, String> variables,
            Long tenantId
    ) {
        try {
            log.info("Sending templated email to: {}, template: {}, tenantId: {}",
                    toEmail, templateCode, tenantId);

            // 构建请求体
            Map<String, Object> request = new HashMap<>();
            request.put("toEmail", toEmail);
            request.put("templateCode", templateCode);
            request.put("variables", variables);
            request.put("tenantId", tenantId);

            notificationClient.sendTemplatedEmail(request);

            log.info("Templated email sent successfully to: {}, template: {}",
                    toEmail, templateCode);
        } catch (Exception e) {
            log.error("Failed to send templated email to: {}, template: {}, error: {}",
                    toEmail, templateCode, e.getMessage());
            // 不抛异常，避免影响主流程
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
