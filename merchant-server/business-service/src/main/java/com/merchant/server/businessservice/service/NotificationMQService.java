package com.merchant.server.businessservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.server.businessservice.dto.AppointmentNotificationDTO;
import com.merchant.server.common.mq.NotificationMessageProducer;
import com.merchant.server.common.dto.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * 通知服务 MQ 版本
 * 使用 RabbitMQ 发送通知消息
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationMQService {

    private final NotificationMessageProducer messageProducer;
    private final NotificationService fallbackService; // 降级到 Feign
    private final ObjectMapper objectMapper;

    @Value("${notification.use-mq:true}")
    private boolean useMQ;

    /**
     * 发送预约确认通知
     */
    public void sendAppointmentConfirmation(AppointmentNotificationDTO notification) {
        if (!useMQ) {
            log.info("MQ is disabled, using fallback service");
            fallbackService.sendAppointmentConfirmation(notification);
            return;
        }

        try {
            log.info("Sending appointment confirmation via MQ for appointment: {}", notification.getAppointmentId());

            NotificationMessage message = buildNotificationMessage(
                    NotificationMessage.MessageType.APPOINTMENT_CONFIRMATION,
                    notification
            );

            messageProducer.sendAppointmentConfirmation(message);
            log.info("Appointment confirmation sent to MQ successfully");
        } catch (Exception e) {
            log.error("Failed to send appointment confirmation via MQ, using fallback: {}", e.getMessage());
            fallbackService.sendAppointmentConfirmation(notification);
        }
    }

    /**
     * 发送预约取消通知
     */
    public void sendAppointmentCancellation(AppointmentNotificationDTO notification) {
        if (!useMQ) {
            log.info("MQ is disabled, using fallback service");
            fallbackService.sendAppointmentCancellation(notification);
            return;
        }

        try {
            log.info("Sending appointment cancellation via MQ for appointment: {}", notification.getAppointmentId());

            NotificationMessage message = buildNotificationMessage(
                    NotificationMessage.MessageType.APPOINTMENT_CANCELLATION,
                    notification
            );

            messageProducer.sendAppointmentCancellation(message);
            log.info("Appointment cancellation sent to MQ successfully");
        } catch (Exception e) {
            log.error("Failed to send appointment cancellation via MQ, using fallback: {}", e.getMessage());
            fallbackService.sendAppointmentCancellation(notification);
        }
    }

    /**
     * 发送预约完成通知
     */
    public void sendAppointmentCompletion(AppointmentNotificationDTO notification) {
        if (!useMQ) {
            log.info("MQ is disabled, using fallback service");
            fallbackService.sendAppointmentCompletion(notification);
            return;
        }

        try {
            log.info("Sending appointment completion via MQ for appointment: {}", notification.getAppointmentId());

            NotificationMessage message = buildNotificationMessage(
                    NotificationMessage.MessageType.APPOINTMENT_COMPLETION,
                    notification
            );

            messageProducer.sendAppointmentCompletion(message);
            log.info("Appointment completion sent to MQ successfully");
        } catch (Exception e) {
            log.error("Failed to send appointment completion via MQ, using fallback: {}", e.getMessage());
            fallbackService.sendAppointmentCompletion(notification);
        }
    }

    /**
     * 发送预约提醒通知
     */
    public void sendAppointmentReminder(AppointmentNotificationDTO notification) {
        if (!useMQ) {
            log.info("MQ is disabled, using fallback service");
            fallbackService.sendAppointmentReminder(notification);
            return;
        }

        try {
            log.info("Sending appointment reminder via MQ for appointment: {}", notification.getAppointmentId());

            NotificationMessage message = buildNotificationMessage(
                    NotificationMessage.MessageType.APPOINTMENT_REMINDER,
                    notification
            );

            messageProducer.sendAppointmentReminder(message);
            log.info("Appointment reminder sent to MQ successfully");
        } catch (Exception e) {
            log.error("Failed to send appointment reminder via MQ, using fallback: {}", e.getMessage());
            fallbackService.sendAppointmentReminder(notification);
        }
    }

    /**
     * 发送短信
     */
    public boolean sendSms(String phoneNumber, String message, Long tenantId, String businessType, String businessId, String businessScenario) {
        log.info("🔍 [DEBUG] NotificationMQService.sendSms called - useMQ flag: {}, phoneNumber: {}", useMQ, phoneNumber);

        if (!useMQ) {
            log.info("🔍 [DEBUG] MQ is disabled, using fallback service");
            return fallbackService.sendSms(phoneNumber, message, tenantId, businessType, businessId, businessScenario);
        }

        try {
            log.info("🔍 [DEBUG] Sending SMS via MQ to: {}", phoneNumber);

            Map<String, Object> payload = new HashMap<>();
            payload.put("phoneNumber", phoneNumber);
            payload.put("message", message);
            payload.put("tenantId", tenantId);
            payload.put("businessType", businessType);
            payload.put("businessId", businessId);
            payload.put("businessScenario", businessScenario);

            NotificationMessage mqMessage = NotificationMessage.builder()
                    .messageType(NotificationMessage.MessageType.SMS)
                    .tenantId(tenantId)
                    .priority(NotificationMessage.Priority.NORMAL)
                    .payload(payload)
                    .build();

            log.info("🔍 [DEBUG] Calling messageProducer.sendSms - METHOD NOT AVAILABLE, using fallback");
            // messageProducer.sendSms(mqMessage); // TODO: This method doesn't exist in NotificationMessageProducer
            // 降级到 Feign 调用
            throw new UnsupportedOperationException("Direct SMS sending via MQ is not supported, use specific scene methods");
            // return true;
        } catch (Exception e) {
            log.error("🔍 [DEBUG] Failed to send SMS via MQ, using fallback: {}", e.getMessage(), e);
            return fallbackService.sendSms(phoneNumber, message, tenantId, businessType, businessId, businessScenario);
        }
    }

    /**
     * 发送模板化邮件
     */
    public void sendTemplatedEmail(String toEmail, String templateCode, Map<String, String> variables, Long tenantId) {
        if (!useMQ) {
            log.info("MQ is disabled, using fallback service");
            fallbackService.sendTemplatedEmail(toEmail, templateCode, variables, tenantId);
            return;
        }

        try {
            log.info("Sending templated email via MQ to: {}, template: {}", toEmail, templateCode);

            Map<String, Object> payload = new HashMap<>();
            payload.put("toEmail", toEmail);
            payload.put("templateCode", templateCode);
            payload.put("variables", variables);
            payload.put("tenantId", tenantId);

            NotificationMessage mqMessage = NotificationMessage.builder()
                    .messageType(NotificationMessage.MessageType.EMAIL)
                    .tenantId(tenantId)
                    .priority(NotificationMessage.Priority.NORMAL)
                    .payload(payload)
                    .build();

            // messageProducer.sendEmail(mqMessage); // TODO: This method doesn't exist in NotificationMessageProducer
            // 降级到 Feign 调用
            throw new UnsupportedOperationException("Templated email via MQ not supported yet, use fallback");
            // log.info("Templated email sent to MQ successfully");
        } catch (Exception e) {
            log.error("Failed to send templated email via MQ, using fallback: {}", e.getMessage());
            fallbackService.sendTemplatedEmail(toEmail, templateCode, variables, tenantId);
        }
    }

    /**
     * 构建通知消息
     */
    @SuppressWarnings("unchecked")
    private NotificationMessage buildNotificationMessage(NotificationMessage.MessageType messageType,
                                                          AppointmentNotificationDTO notification) {
        // 根据消息类型确定通知场景
        String scene;
        switch (messageType) {
            case APPOINTMENT_CONFIRMATION:
                scene = "appointment.confirmation";
                break;
            case APPOINTMENT_CANCELLATION:
                scene = "appointment.cancellation";
                break;
            case APPOINTMENT_COMPLETION:
                scene = "appointment.completion";
                break;
            case APPOINTMENT_REMINDER:
                scene = "appointment.reminder";
                break;
            default:
                scene = null;
        }

        // 构建接收者信息
        com.merchant.server.common.dto.NotificationRequest.RecipientInfo recipient =
            com.merchant.server.common.dto.NotificationRequest.RecipientInfo.builder()
                .email(notification.getCustomerEmail())
                .phone(notification.getCustomerPhone())
                .name(notification.getCustomerName())
                .build();

        // 构建通知渠道
        String channel;
        if ("EMAIL".equalsIgnoreCase(notification.getCommunicationPreference())) {
            channel = "EMAIL";
        } else if ("SMS".equalsIgnoreCase(notification.getCommunicationPreference())) {
            channel = "SMS";
        } else {
            channel = "BOTH";  // 默认两种都发
        }

        // 将通知DTO转换为模板变量
        Map<String, Object> variables = objectMapper.convertValue(notification, Map.class);

        // 添加 staffName 字段（模板中使用 staffName，但DTO中是 resourceName）
        if (notification.getResourceName() != null) {
            variables.put("staffName", notification.getResourceName());
        }

        // 构建NotificationRequest
        com.merchant.server.common.dto.NotificationRequest request =
            com.merchant.server.common.dto.NotificationRequest.builder()
                .scene(scene)
                .tenantId(notification.getTenantId())
                .recipient(recipient)
                .channel(channel)
                .variables(variables)
                .businessId(String.valueOf(notification.getAppointmentId()))
                .build();

        // 将NotificationRequest作为payload
        Map<String, Object> payload = objectMapper.convertValue(request, Map.class);

        log.info("构建通知消息 - scene: {}, channel: {}, recipient: {}, businessId: {}",
            request.getScene(), request.getChannel(), request.getRecipient(), request.getBusinessId());
        log.info("Variables: staffName={}, resourceName={}, serviceName={}",
            variables.get("staffName"), variables.get("resourceName"), variables.get("serviceName"));
        log.info("Payload keys: {}", payload.keySet());

        return NotificationMessage.builder()
                .messageType(messageType)
                .tenantId(notification.getTenantId())
                .priority(NotificationMessage.Priority.NORMAL)
                .payload(payload)
                .build();
    }
}
