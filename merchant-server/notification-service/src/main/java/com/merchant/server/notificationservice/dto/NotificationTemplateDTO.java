package com.merchant.server.notificationservice.dto;

import com.merchant.server.notificationservice.entity.NotificationTemplate;
import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class NotificationTemplateDTO {
    
    private Long id;
    
    @NotNull
    private Long tenantId;
    
    @NotBlank
    private String templateCode;
    
    @NotBlank
    private String templateName;
    
    @NotNull
    private NotificationTemplate.NotificationType type;
    
    private String subject; // 邮件主题
    
    @NotBlank
    private String content; // 模板内容
    
    private NotificationTemplate.TemplateStatus status = NotificationTemplate.TemplateStatus.ACTIVE;
}