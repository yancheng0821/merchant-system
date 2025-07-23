package com.merchant.server.notificationservice.controller;

import com.merchant.server.notificationservice.dto.AppointmentNotificationDTO;
import com.merchant.server.notificationservice.entity.NotificationLog;
import com.merchant.server.notificationservice.service.AppointmentNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v2/appointment-notifications")
@RequiredArgsConstructor
@Slf4j
public class AppointmentNotificationV2Controller {

    private final AppointmentNotificationService appointmentNotificationService;

    /**
     * 发送预约确认通知
     */
    @PostMapping("/confirmation")
    public ResponseEntity<NotificationLog> sendConfirmation(@RequestBody AppointmentNotificationDTO appointment) {
        log.info("Received appointment confirmation notification request for appointment: {}", appointment.getAppointmentId());
        
        try {
            NotificationLog result = appointmentNotificationService.sendAppointmentConfirmation(appointment);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error sending appointment confirmation notification", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 发送预约取消通知
     */
    @PostMapping("/cancellation")
    public ResponseEntity<NotificationLog> sendCancellation(@RequestBody AppointmentNotificationDTO appointment) {
        log.info("Received appointment cancellation notification request for appointment: {}", appointment.getAppointmentId());
        
        try {
            NotificationLog result = appointmentNotificationService.sendAppointmentCancellation(appointment);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error sending appointment cancellation notification", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 发送预约完成通知
     */
    @PostMapping("/completion")
    public ResponseEntity<NotificationLog> sendCompletion(@RequestBody AppointmentNotificationDTO appointment) {
        log.info("Received appointment completion notification request for appointment: {}", appointment.getAppointmentId());
        
        try {
            NotificationLog result = appointmentNotificationService.sendAppointmentCompletion(appointment);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error sending appointment completion notification", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 发送预约提醒通知
     */
    @PostMapping("/reminder")
    public ResponseEntity<NotificationLog> sendReminder(@RequestBody AppointmentNotificationDTO appointment) {
        log.info("Received appointment reminder notification request for appointment: {}", appointment.getAppointmentId());
        
        try {
            NotificationLog result = appointmentNotificationService.sendAppointmentReminder(appointment);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error sending appointment reminder notification", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 批量发送预约提醒通知
     */
    @PostMapping("/batch-reminders")
    public ResponseEntity<List<NotificationLog>> sendBatchReminders(@RequestBody List<AppointmentNotificationDTO> appointments) {
        log.info("Received batch appointment reminder notification request, count: {}", appointments.size());
        
        try {
            List<NotificationLog> results = appointmentNotificationService.sendBatchAppointmentReminders(appointments);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            log.error("Error sending batch appointment reminder notifications", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}