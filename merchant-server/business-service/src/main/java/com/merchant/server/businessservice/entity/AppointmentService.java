package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class AppointmentService {
    
    private Long id;
    
    private Long appointmentId;
    
    private Long serviceId;
    
    private String serviceName;
    
    private BigDecimal price;
    
    private Integer duration; // 分钟
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    // 关联对象（如果需要的话）
    private Appointment appointment;
    
    private Service service;

}