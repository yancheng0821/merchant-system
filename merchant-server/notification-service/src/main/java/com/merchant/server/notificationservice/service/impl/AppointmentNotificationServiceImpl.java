package com.merchant.server.notificationservice.service.impl;

import com.merchant.server.notificationservice.dto.AppointmentNotificationDTO;
import com.merchant.server.notificationservice.dto.SendNotificationRequest;
import com.merchant.server.notificationservice.entity.NotificationLog;
import com.merchant.server.notificationservice.entity.NotificationTemplate;
import com.merchant.server.notificationservice.service.AppointmentNotificationService;
import com.merchant.server.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentNotificationServiceImpl implements AppointmentNotificationService {

    private final NotificationService notificationService;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy年MM月dd日");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    @Override
    public NotificationLog sendAppointmentConfirmation(AppointmentNotificationDTO appointment) {
        log.info("Sending appointment confirmation for appointment {}", appointment.getAppointmentId());
        return sendNotification(appointment, "APPOINTMENT_CONFIRMED");
    }

    @Override
    public NotificationLog sendAppointmentCancellation(AppointmentNotificationDTO appointment) {
        log.info("Sending appointment cancellation for appointment {}", appointment.getAppointmentId());
        return sendNotification(appointment, "APPOINTMENT_CANCELLED");
    }

    @Override
    public NotificationLog sendAppointmentCompletion(AppointmentNotificationDTO appointment) {
        log.info("Sending appointment completion for appointment {}", appointment.getAppointmentId());
        return sendNotification(appointment, "APPOINTMENT_COMPLETED");
    }

    @Override
    public NotificationLog sendAppointmentReminder(AppointmentNotificationDTO appointment) {
        log.info("Sending appointment reminder for appointment {}", appointment.getAppointmentId());
        return sendNotification(appointment, "APPOINTMENT_REMINDER");
    }

    @Override
    public List<NotificationLog> sendBatchAppointmentReminders(List<AppointmentNotificationDTO> appointments) {
        log.info("Sending batch appointment reminders, count: {}", appointments.size());
        
        List<NotificationLog> results = new ArrayList<>();
        for (AppointmentNotificationDTO appointment : appointments) {
            try {
                NotificationLog result = sendAppointmentReminder(appointment);
                results.add(result);
            } catch (Exception e) {
                log.error("Error sending reminder for appointment {}", appointment.getAppointmentId(), e);
            }
        }
        
        return results;
    }
    
    private NotificationLog sendNotification(AppointmentNotificationDTO appointment, String templateCode) {
        // 构建通知变量
        Map<String, Object> variables = buildNotificationVariables(appointment);
        
        String communicationPreference = appointment.getCommunicationPreference();
        
        // 如果是"BOTH"，同时发送邮件和短信
        if ("BOTH".equalsIgnoreCase(communicationPreference)) {
            return sendBothNotifications(appointment, templateCode, variables);
        } else {
            // 单一通知方式
            return sendSingleNotification(appointment, templateCode, variables, communicationPreference);
        }
    }
    
    private NotificationLog sendBothNotifications(AppointmentNotificationDTO appointment, String templateCode, Map<String, Object> variables) {
        log.info("Sending both email and SMS notifications for appointment {}", appointment.getAppointmentId());
        
        NotificationLog emailResult = null;
        NotificationLog smsResult = null;
        
        // 发送邮件（如果有邮箱地址）
        if (appointment.getCustomerEmail() != null && !appointment.getCustomerEmail().trim().isEmpty()) {
            try {
                emailResult = sendSingleNotification(appointment, templateCode, variables, "EMAIL");
                log.info("Email notification sent successfully for appointment {}", appointment.getAppointmentId());
            } catch (Exception e) {
                log.error("Failed to send email notification for appointment {}", appointment.getAppointmentId(), e);
            }
        } else {
            log.warn("No email address available for appointment {}", appointment.getAppointmentId());
        }
        
        // 发送短信（如果有手机号）
        if (appointment.getCustomerPhone() != null && !appointment.getCustomerPhone().trim().isEmpty()) {
            try {
                smsResult = sendSingleNotification(appointment, templateCode, variables, "SMS");
                log.info("SMS notification sent successfully for appointment {}", appointment.getAppointmentId());
            } catch (Exception e) {
                log.error("Failed to send SMS notification for appointment {}", appointment.getAppointmentId(), e);
            }
        } else {
            log.warn("No phone number available for appointment {}", appointment.getAppointmentId());
        }
        
        // 返回结果：优先返回成功的结果，如果都失败则返回最后一个错误
        if (emailResult != null && emailResult.getStatus() == NotificationLog.NotificationStatus.SENT) {
            return emailResult;
        } else if (smsResult != null && smsResult.getStatus() == NotificationLog.NotificationStatus.SENT) {
            return smsResult;
        } else {
            // 如果都失败了，返回一个合并的错误结果
            NotificationLog failedResult = smsResult != null ? smsResult : emailResult;
            if (failedResult != null) {
                failedResult.setErrorMessage("Both email and SMS notifications failed");
            }
            return failedResult;
        }
    }
    
    private NotificationLog sendSingleNotification(AppointmentNotificationDTO appointment, String templateCode, Map<String, Object> variables, String preferenceOverride) {
        // 根据客户的通信偏好决定发送方式
        NotificationTemplate.NotificationType notificationType = getNotificationType(preferenceOverride != null ? preferenceOverride : appointment.getCommunicationPreference());
        String recipient = getRecipient(appointment, notificationType);
        
        // 构建发送请求
        SendNotificationRequest sendRequest = new SendNotificationRequest();
        sendRequest.setTenantId(appointment.getTenantId());
        sendRequest.setTemplateCode(templateCode);
        sendRequest.setType(notificationType);
        sendRequest.setRecipient(recipient);
        sendRequest.setBusinessId(appointment.getAppointmentId().toString());
        sendRequest.setBusinessType("APPOINTMENT");
        sendRequest.setVariables(variables);
        
        return notificationService.sendNotification(sendRequest);
    }
    
    private Map<String, Object> buildNotificationVariables(AppointmentNotificationDTO appointment) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("customerName", appointment.getCustomerName());
        variables.put("appointmentDate", appointment.getAppointmentDate().format(DATE_FORMATTER));
        variables.put("appointmentTime", appointment.getAppointmentTime().format(TIME_FORMATTER));
        variables.put("serviceName", appointment.getServiceName() != null ? appointment.getServiceName() : "");
        variables.put("staffName", appointment.getResourceName() != null ? appointment.getResourceName() : "");
        variables.put("duration", appointment.getDuration() != null ? appointment.getDuration() + "分钟" : "");
        variables.put("totalAmount", appointment.getTotalAmount() != null ? "¥" + appointment.getTotalAmount() : "");
        variables.put("businessName", appointment.getBusinessName() != null ? appointment.getBusinessName() : "");
        variables.put("businessAddress", appointment.getBusinessAddress() != null ? appointment.getBusinessAddress() : "");
        variables.put("businessPhone", appointment.getBusinessPhone() != null ? appointment.getBusinessPhone() : "");
        variables.put("notes", appointment.getNotes() != null ? appointment.getNotes() : "");
        return variables;
    }
    
    private NotificationTemplate.NotificationType getNotificationType(String communicationPreference) {
        if ("EMAIL".equalsIgnoreCase(communicationPreference)) {
            return NotificationTemplate.NotificationType.EMAIL;
        } else {
            // SMS 和 PHONE 都使用短信发送
            return NotificationTemplate.NotificationType.SMS;
        }
    }
    
    private String getRecipient(AppointmentNotificationDTO appointment, NotificationTemplate.NotificationType type) {
        if (type == NotificationTemplate.NotificationType.EMAIL) {
            return appointment.getCustomerEmail();
        } else {
            return appointment.getCustomerPhone();
        }
    }
}