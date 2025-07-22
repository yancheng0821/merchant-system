package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class Service {
    
    private Long id;
    
    private Long tenantId;
    
    private Long categoryId;
    
    private String name;
    
    private String nameEn;
    
    private String description;
    
    private String descriptionEn;
    
    private BigDecimal price;
    
    private Integer duration; // 分钟
    
    private SkillLevel skillLevel = SkillLevel.BEGINNER;
    
    private ServiceStatus status = ServiceStatus.ACTIVE;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // 关联对象（如果需要的话）
    private ServiceCategory category;
    
    private List<Staff> staff;
    
    // 枚举定义
    public enum SkillLevel {
        BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
    }
    
    public enum ServiceStatus {
        ACTIVE, INACTIVE
    }

}