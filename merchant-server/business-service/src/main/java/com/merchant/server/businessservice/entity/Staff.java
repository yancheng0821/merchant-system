package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class Staff {
    
    private Long id;
    
    private Long tenantId;
    
    private String name;
    
    private String phone;
    
    private String email;
    
    private String position; // 职位
    
    private String skills; // 技能描述
    
    private StaffStatus status = StaffStatus.ACTIVE;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate; // 入职日期
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // 枚举定义
    public enum StaffStatus {
        ACTIVE, INACTIVE, VACATION
    }
}