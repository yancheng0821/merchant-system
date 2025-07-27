package com.merchant.server.businessservice.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * POS交易记录实体类
 */
@Data
public class POSTransaction {
    private Long id;
    
    private Long tenantId;
    private Long orderId;
    private String transactionId;
    private String posTerminalId;
    private String posProvider;
    private Double amount;
    private String paymentMethod;
    private String transactionStatus;
    private String requestData;
    private String responseData;
    private Integer retryCount;
    private LocalDateTime nextRetryTime;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}