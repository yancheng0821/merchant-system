package com.merchant.server.businessservice.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 订单实体类
 */
@Data
public class Order {
    private Long id;
    
    private Long tenantId;
    private String orderNumber;
    private Long customerId;
    private Long appointmentId;
    private Long resourceId;
    private String resourceType;
    
    // 金额信息
    private Double subtotal;
    private Double taxRate;
    private Double taxAmount;
    private Double tipAmount;
    private Double tipPercentage;
    private Double totalAmount;
    
    // 支付信息
    private String paymentMethod;
    private String paymentStatus;
    private String orderStatus;
    private String posTerminalId;
    private String transactionId;
    private String cardLast4;
    private String authorizationCode;
    
    // 其他信息
    private String notes;
    private Double refundAmount;
    private String refundReason;
    
    // 时间戳
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;
    
    // 操作人
    private Long createdBy;
    private Long updatedBy;
}