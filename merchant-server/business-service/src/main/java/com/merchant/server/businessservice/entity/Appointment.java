package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
public class Appointment {
    
    private Long id;
    
    private Long tenantId;
    
    private Long customerId;
    

    
    private Long resourceId;
    
    private ResourceType resourceType;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate appointmentDate;
    
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime appointmentTime;
    
    private Integer duration; // 分钟
    
    private BigDecimal totalAmount;
    
    private AppointmentStatus status = AppointmentStatus.CONFIRMED;
    
    private String notes;
    
    private Integer rating;
    
    private String review;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // 关联对象（如果需要的话）
    private Customer customer;
    
    private Staff staff;
    
    private Resource resource;
    
    // 预约服务明细
    private List<AppointmentService> appointmentServices;
    
    // 枚举定义
    public enum AppointmentStatus {
        CONFIRMED, COMPLETED, CANCELLED, NO_SHOW
    }
    
    public enum ResourceType {
        STAFF, ROOM
    }
    

}