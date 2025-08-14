package com.merchant.server.businessservice.dto;

import com.merchant.server.businessservice.entity.Appointment;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class AppointmentCreateDTO {
    
    private Long tenantId;
    private Long customerId;
    
    // 选中的资源信息，用于创建资源预约时段（必填）
    private List<SelectedResourceDTO> selectedResources;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate appointmentDate;
    
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime appointmentTime;
    
    private Integer duration;
    private BigDecimal totalAmount;
    private Appointment.AppointmentStatus status;
    private String notes;
    private Integer rating;
    private String review;
    
    // 服务信息
    private List<AppointmentServiceDTO> services;
    
    @Data
    public static class AppointmentServiceDTO {
        private Long serviceId;
        private String serviceName;
        private Integer duration;
        private BigDecimal price;
        private Long categoryId;
    }
    
    @Data
    public static class SelectedResourceDTO {
        private Long id;
        private String type; // 'STAFF' or 'ROOM'
    }
}