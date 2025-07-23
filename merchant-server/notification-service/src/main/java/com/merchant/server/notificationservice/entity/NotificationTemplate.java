package com.merchant.server.notificationservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationTemplate {
    
    private Long id;
    
    private Long tenantId;
    
    private String templateCode; // 模板代码，如：APPOINTMENT_CREATED, APPOINTMENT_CANCELLED, APPOINTMENT_COMPLETED
    
    private String templateName; // 模板名称
    
    private NotificationType type; // SMS, EMAIL
    
    private String subject; // 邮件主题（短信不需要）
    
    private String content; // 模板内容，支持变量替换
    
    private TemplateStatus status = TemplateStatus.ACTIVE;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // 枚举定义
    public enum NotificationType {
        SMS, EMAIL
    }
    
    public enum TemplateStatus {
        ACTIVE, INACTIVE
    }
}