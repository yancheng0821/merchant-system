package com.merchant.server.businessservice.dto;

import lombok.Data;
import lombok.Builder;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 支付响应DTO
 */
@Data
@Builder
public class PaymentResponseDTO {
    private String transactionId;
    private String orderId;
    private String status; // initiated, processing, success, failed
    private String paymentMethod;
    private BigDecimal amount;
    private BigDecimal changeAmount; // 现金找零
    
    // 卡支付信息
    private String cardBrand;
    private String cardLast4;
    private String authorizationCode;
    
    // 状态信息
    private String message;
    private String errorCode;
    private String errorMessage;
    
    // 时间戳
    private LocalDateTime initiatedAt;
    private LocalDateTime completedAt;
    
    // 操作提示
    private String actionRequired;
    private String displayMessage;
    private Integer timeout;
}