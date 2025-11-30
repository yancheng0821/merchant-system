package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class MarketingRule {

    private Long id;
    private Long tenantId;
    private String name;
    private Boolean enabled = true;

    // 触发条件
    private TriggerType triggerType;
    private Integer triggerDays;

    // 客户筛选条件 (JSON格式)
    private String customerFilter;

    // 通知设置
    private NotificationType notificationType;
    private Long templateId;
    private String customSubject;
    private String customContent;

    // 调度设置
    private ScheduleType scheduleType = ScheduleType.MANUAL;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime scheduleTime;

    private Integer scheduleDayOfWeek;

    // 防重复发送
    private Integer cooldownDays = 30;

    // 统计信息
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastRunAt;

    private Integer totalSentCount = 0;

    // 匹配客户数量（非持久化字段）
    private Integer matchedCustomerCount;

    // 时间戳
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    private String createdBy;
    private String updatedBy;

    // 枚举定义
    public enum TriggerType {
        INACTIVE_DAYS,      // 不活跃天数
        LAST_VISIT_DAYS,    // 距上次到店天数
        NO_BOOKING_DAYS     // 无预约天数
    }

    public enum NotificationType {
        EMAIL,
        SMS,
        BOTH
    }

    public enum ScheduleType {
        MANUAL,     // 手动触发
        DAILY,      // 每日执行
        WEEKLY      // 每周执行
    }
}
