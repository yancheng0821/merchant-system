package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.LocalTime;

/**
 * 预约候补名单表
 * 类似Jane App的Waitlist功能
 */
@Data
public class AppointmentWaitlist {

    private Long id;

    private Long tenantId;

    private Long customerId;

    private Long serviceId;

    private Long preferredResourceId; // 偏好技师ID(可为空)

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate preferredDateStart; // 期望日期范围-开始

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate preferredDateEnd; // 期望日期范围-结束

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime preferredTimeStart; // 期望时间段-开始

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime preferredTimeEnd; // 期望时间段-结束

    private Boolean flexibleOnResource = true; // 技师可灵活

    private Boolean flexibleOnTime = true; // 时间可灵活

    private WaitlistStatus status = WaitlistStatus.ACTIVE; // 状态

    private Integer priority = 3; // 优先级(1-5, 5最高)

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime notifiedAt; // 通知时间

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime expiresAt; // 过期时间

    private String notes; // 备注

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    // 关联的Customer, Service, Resource信息
    private Customer customer;
    private Service service;
    private Resource preferredResource;

    /**
     * 候补名单状态枚举
     */
    public enum WaitlistStatus {
        ACTIVE,    // 活跃中
        NOTIFIED,  // 已通知
        BOOKED,    // 已预订
        EXPIRED,   // 已过期
        CANCELLED  // 已取消
    }

    /**
     * 判断候补是否已过期
     */
    public boolean isExpired() {
        if (expiresAt == null) {
            return false;
        }
        return LocalDateTime.now(ZoneOffset.UTC).isAfter(expiresAt);
    }

    /**
     * 判断候补是否仍然有效
     */
    public boolean isStillActive() {
        return status == WaitlistStatus.ACTIVE && !isExpired();
    }

    /**
     * 检查给定的日期时间是否匹配候补条件
     */
    public boolean matchesDateTime(LocalDate date, LocalTime time) {
        // 检查日期范围
        if (date.isBefore(preferredDateStart) || date.isAfter(preferredDateEnd)) {
            return false;
        }

        // 如果时间可灵活,任何时间都可以
        if (Boolean.TRUE.equals(flexibleOnTime)) {
            return true;
        }

        // 检查时间范围
        if (preferredTimeStart != null && preferredTimeEnd != null) {
            return !time.isBefore(preferredTimeStart) && !time.isAfter(preferredTimeEnd);
        }

        return true;
    }

    /**
     * 检查给定的技师是否匹配候补条件
     */
    public boolean matchesResource(Long resourceId) {
        // 如果技师可灵活,任何技师都可以
        if (Boolean.TRUE.equals(flexibleOnResource)) {
            return true;
        }

        // 检查是否为偏好技师
        return preferredResourceId != null && preferredResourceId.equals(resourceId);
    }

    /**
     * 获取优先级的星级显示
     */
    public String getPriorityStars() {
        if (priority == null || priority < 1) {
            return "";
        }

        StringBuilder stars = new StringBuilder();
        for (int i = 0; i < Math.min(priority, 5); i++) {
            stars.append("⭐");
        }
        return stars.toString();
    }
}
