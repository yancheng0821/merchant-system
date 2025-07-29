package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class ResourceBookingSlot {
    
    private Long id;
    
    private Long resourceId;
    
    private Long appointmentId;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate bookingDate;
    
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime startTime;
    
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime endTime;
    
    private BookingStatus status = BookingStatus.BOOKED;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // 关联的资源对象
    private Resource resource;
    
    // 关联的预约对象
    private Appointment appointment;
    
    // 枚举定义
    public enum BookingStatus {
        BOOKED, CANCELLED
    }
}