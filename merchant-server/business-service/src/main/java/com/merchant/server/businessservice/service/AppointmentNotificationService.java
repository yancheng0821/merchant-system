package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.entity.Appointment;

public interface AppointmentNotificationService {
    
    /**
     * 发送预约确认通知
     */
    void sendConfirmationNotification(Appointment appointment);
    
    /**
     * 发送预约取消通知
     */
    void sendCancellationNotification(Appointment appointment);
    
    /**
     * 发送预约完成通知
     */
    void sendCompletionNotification(Appointment appointment);
    
    /**
     * 发送预约提醒通知
     */
    void sendReminderNotification(Appointment appointment);
}