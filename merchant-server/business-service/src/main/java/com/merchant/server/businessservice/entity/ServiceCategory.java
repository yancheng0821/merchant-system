package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ServiceCategory {
    
    private Long id;
    
    private Long tenantId;
    
    private String name;
    
    private String nameEn;
    
    private String description;
    
    private String icon;
    
    private String color;
    
    private Integer sortOrder = 0;
    
    private CategoryStatus status = CategoryStatus.ACTIVE;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // 关联服务
    private List<Service> services;
    
    // 枚举定义
    public enum CategoryStatus {
        ACTIVE, INACTIVE
    }

}