package com.merchant.server.notificationservice.dto;

import com.merchant.server.notificationservice.entity.NotificationTemplate;
import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

@Data
public class SendNotificationRequest {
    
    @NotNull
    private Long tenantId;
    
    @NotBlank
    private String templateCode; // APPOINTMENT_CREATED, APPOINTMENT_CANCELLED, APPOINTMENT_COMPLETED
    
    @NotNull
    private NotificationTemplate.NotificationType type; // SMS, EMAIL
    
    @NotBlank
    private String recipient; // 手机号或邮箱
    
    private Map<String, Object> variables; // 模板变量
    
    private String businessId; // 业务ID（如预约ID）
    
    private String businessType; // 业务类型（如APPOINTMENT）
    
    // 用户联系偏好
    private String contactPreference; // SMS, EMAIL, BOTH
}