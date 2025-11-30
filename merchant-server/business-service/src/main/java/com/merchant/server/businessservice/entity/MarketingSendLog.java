package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 营销发送记录实体
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarketingSendLog {

    private Long id;
    private Long tenantId;
    private Long ruleId;
    private String ruleName;

    // 客户信息
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    // 发送信息
    private NotificationType notificationType;
    private String subject;
    private String content;

    // 发送状态
    private Status status;
    private String errorMessage;

    // 发送时间
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime sentAt;

    public enum NotificationType {
        EMAIL,
        SMS
    }

    public enum Status {
        PENDING,
        SENT,
        FAILED
    }
}
