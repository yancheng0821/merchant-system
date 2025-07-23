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
        
        // 根据客户的通信偏好决定发送方式
        NotificationTemplate.NotificationType notificationType = getNotificationType(appointment.getCommunicationPreference());
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
        variables.put("staffName", appointment.getStaffName() != null ? appointment.getStaffName() : "");
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