package com.merchant.server.businessservice.dto.pos;

import lombok.Data;
import lombok.Builder;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * POS交易状态
 */
@Data
@Builder
public class POSTransactionStatus {
    private String transactionId;
    private String status; // pending, approved, declined, cancelled, refunded, failed
    private String paymentMethod;
    private BigDecimal amount;
    private BigDecimal approvedAmount;
    
    // 卡信息
    private String cardBrand; // visa, mastercard, amex等
    private String cardLast4;
    private String cardHolderName;
    
    // 交易详情
    private String authorizationCode;
    private String referenceNumber;
    private String responseCode;
    private String responseMessage;
    
    // 时间戳
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    
    // 附加信息
    private Map<String, Object> additionalData;
    
    // 错误信息
    private String errorCode;
    private String errorMessage;
    
    public boolean isSuccess() {
        return "approved".equals(status);
    }
    
    public boolean isFinal() {
        return "approved".equals(status) || "declined".equals(status) || 
               "cancelled".equals(status) || "failed".equals(status);
    }
}