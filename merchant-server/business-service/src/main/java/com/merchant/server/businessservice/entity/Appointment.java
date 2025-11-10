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

    // 支付相关字段
    private Boolean paid;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime paidTime;

    private String paymentMethod;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    // 提醒发送标记
    private Boolean reminder24hSent = false;  // 24小时提醒是否已发送
    private Boolean reminder30minSent = false; // 30分钟提醒是否已发送
    
    // 关联对象（如果需要的话）
    private Customer customer;
    
    // 预约服务明细
    private List<AppointmentService> appointmentServices;
    
    // 预约关联的所有资源
    private List<AppointmentResource> appointmentResources;
    
    // 便捷方法：获取员工资源
    public AppointmentResource getStaffResource() {
        if (appointmentResources == null) return null;
        return appointmentResources.stream()
            .filter(r -> r.getResourceType() == AppointmentResource.ResourceType.STAFF)
            .findFirst()
            .orElse(null);
    }
    
    // 便捷方法：获取房间资源
    public AppointmentResource getRoomResource() {
        if (appointmentResources == null) return null;
        return appointmentResources.stream()
            .filter(r -> r.getResourceType() == AppointmentResource.ResourceType.ROOM)
            .findFirst()
            .orElse(null);
    }
    
    // 枚举定义
    public enum AppointmentStatus {
        CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED, NO_SHOW
    }
}