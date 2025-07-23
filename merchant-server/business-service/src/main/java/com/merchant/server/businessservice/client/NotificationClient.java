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
                            @Value("${notification.service.url:http://localhost:8084}") String notificationServiceUrl) {
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
            log.error("Failed to send appointment confirmation notification", e);
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
            log.error("Failed to send appointment cancellation notification", e);
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
            log.error("Failed to send appointment completion notification", e);
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
            log.error("Failed to send appointment reminder notification", e);
        }
    }
}