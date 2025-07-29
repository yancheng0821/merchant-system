package com.merchant.server.businessservice.dto;

import com.merchant.server.businessservice.entity.Resource;
import com.merchant.server.businessservice.entity.ResourceAvailability;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class ResourceCreateDTO {
    
    private Long tenantId;
    
    private String name;
    
    private Resource.ResourceType type;
    
    private String description;
    
    private Integer capacity = 1;
    
    private String location;
    
    private String equipment; // JSON格式存储设备信息
    
    private String specialties; // JSON格式存储专长信息
    
    private BigDecimal hourlyRate;
    
    private Resource.ResourceStatus status = Resource.ResourceStatus.ACTIVE;
    
    // 员工特有字段
    private String phone; // 联系电话（员工专用）
    
    private String email; // 邮箱（员工专用）
    
    private String position; // 职位（员工专用）
    
    private LocalDate startDate; // 入职日期（员工专用）
    
    private String avatar; // 员工头像URL（员工专用）
    
    private String icon; // 房间图标URL或图标名称（房间专用）
    
    // 可用性信息
    private List<ResourceAvailabilityDTO> availabilities;
    
    @Data
    public static class ResourceAvailabilityDTO {
        private Integer dayOfWeek; // 1-7，1为周一
        private String startTime; // HH:mm格式
        private String endTime; // HH:mm格式
        private Boolean isAvailable = true;
    }
}