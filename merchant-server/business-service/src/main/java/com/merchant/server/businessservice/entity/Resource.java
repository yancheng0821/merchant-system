package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class Resource {
    
    private Long id;
    
    private Long tenantId;
    
    private String name;
    
    private ResourceType type;
    
    private String description;
    
    private Integer capacity = 1;
    
    private String location;
    
    private String equipment; // JSON格式存储设备信息
    
    private String specialties; // JSON格式存储专长信息
    
    private BigDecimal hourlyRate;
    
    private ResourceStatus status = ResourceStatus.ACTIVE;
    
    // 员工特有字段
    private String phone; // 联系电话（员工专用）
    
    private String email; // 邮箱（员工专用）
    
    private String position; // 职位（员工专用）
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private java.time.LocalDate startDate; // 入职日期（员工专用）
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // 关联的可用性时间段
    private List<ResourceAvailability> availabilities;
    
    // 枚举定义
    public enum ResourceType {
        STAFF, ROOM
    }
    
    public enum ResourceStatus {
        ACTIVE, INACTIVE, MAINTENANCE, VACATION, DELETED
    }
}