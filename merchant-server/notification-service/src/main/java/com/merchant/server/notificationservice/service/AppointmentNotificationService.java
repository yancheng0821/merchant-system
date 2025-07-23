package com.merchant.server.notificationservice.service;

import com.merchant.server.notificationservice.dto.AppointmentNotificationDTO;
import com.merchant.server.notificationservice.entity.NotificationLog;

import java.util.List;

public interface AppointmentNotificationService {
    
    /**
     * 发送预约确认通知
     */
    NotificationLog sendAppointmentConfirmation(AppointmentNotificationDTO appointment);
    
    /**
     * 发送预约取消通知
     */
    NotificationLog sendAppointmentCancellation(AppointmentNotificationDTO appointment);
    
    /**
     * 发送预约完成通知
     */
    NotificationLog sendAppointmentCompletion(AppointmentNotificationDTO appointment);
    
    /**
     * 发送预约提醒通知
     */
    NotificationLog sendAppointmentReminder(AppointmentNotificationDTO appointment);
    
    /**
     * 批量发送预约提醒
     */
    List<NotificationLog> sendBatchAppointmentReminders(List<AppointmentNotificationDTO> appointments);
}