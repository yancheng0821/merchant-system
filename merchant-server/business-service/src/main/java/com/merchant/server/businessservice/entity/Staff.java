package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class Staff {
    
    private Long id;
    
    private Long tenantId;
    
    private String name;
    
    private String phone;
    
    private String email;
    
    private String position;
    
    private String skills;
    
    private StaffStatus status = StaffStatus.ACTIVE;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // 关联服务
    private List<Service> services;
    
    // 预约记录
    private List<Appointment> appointments;
    
    // 枚举定义
    public enum StaffStatus {
        ACTIVE, INACTIVE, VACATION
    }

}