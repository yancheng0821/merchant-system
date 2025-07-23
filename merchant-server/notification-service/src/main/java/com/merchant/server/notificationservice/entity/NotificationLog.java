package com.merchant.server.notificationservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationLog {
    
    private Long id;
    
    private Long tenantId;
    
    private String templateCode;
    
    private NotificationTemplate.NotificationType type;
    
    private String recipient; // 接收者（手机号或邮箱）
    
    private String subject; // 邮件主题
    
    private String content; // 发送内容
    
    private NotificationStatus status = NotificationStatus.PENDING;
    
    private String errorMessage; // 失败原因
    
    private Integer retryCount = 0; // 重试次数
    
    private String businessId; // 业务ID（如预约ID）
    
    private String businessType; // 业务类型（如APPOINTMENT）
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime sentAt; // 发送时间
    
    // 枚举定义
    public enum NotificationStatus {
        PENDING, SENT, FAILED, CANCELLED
    }
}