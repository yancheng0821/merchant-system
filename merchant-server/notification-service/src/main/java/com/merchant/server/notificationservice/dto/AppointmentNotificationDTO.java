package com.merchant.server.notificationservice.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AppointmentNotificationDTO {
    
    private Long appointmentId;
    private Long tenantId;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String communicationPreference; // SMS, EMAIL, PHONE
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate appointmentDate;
    
    @JsonFormat(pattern = "HH:mm")
    private LocalTime appointmentTime;
    
    private Integer duration;
    private BigDecimal totalAmount;
    private String status;
    private String notes;
    
    private Long resourceId;
    private String resourceType; // STAFF, ROOM
    private String resourceName; // 资源名称（员工姓名或房间名称）
    private String serviceName;
    private String businessName;
    private String businessAddress;
    private String businessPhone;
    
    // 通知类型
    public enum NotificationType {
        APPOINTMENT_CONFIRMED,
        APPOINTMENT_CANCELLED, 
        APPOINTMENT_COMPLETED,
        APPOINTMENT_REMINDER
    }
}