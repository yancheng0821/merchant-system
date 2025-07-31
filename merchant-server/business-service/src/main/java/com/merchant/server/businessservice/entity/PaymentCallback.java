package com.merchant.server.businessservice.entity;

import com.merchant.server.businessservice.enums.CallbackStatus;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 支付回调日志实体类
 */
@Data
public class PaymentCallback {
    private Long id;
    
    private Long tenantId;
    private Long orderId;
    private String transactionId;
    private String callbackType;
    private String callbackData;
    private CallbackStatus callbackStatus;
    private String processingResult;
    private String errorMessage;
    private Integer retryCount;
    private LocalDateTime nextRetryTime;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}