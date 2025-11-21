package com.merchant.server.businessservice.entity;

import lombok.Data;
import java.math.BigDecimal;
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
    private Boolean isMixedPayment;  // 是否混合支付
    private String tipPaymentMethod;  // 小费支付方式
    private String paymentStatus;
    private String status;  // 订单状态
    private String orderStatus;
    private String posTerminalId;
    private String transactionId;
    private String cardLast4;
    private String authorizationCode;

    // 各支付方式金额明细（用于统计和补充支付场景）
    private BigDecimal giftCardAmount;    // 礼品卡支付金额
    private BigDecimal cashAmount;        // 现金支付金额
    private BigDecimal creditCardAmount;  // 信用卡支付金额
    private BigDecimal debitCardAmount;   // 借记卡支付金额
    private BigDecimal packageAmount;     // 套餐支付金额
    
    // 其他信息
    private String notes;
    private Double refundAmount;
    private String refundReason;
    
    // 时间戳
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;
    private LocalDateTime paidAt;  // 支付时间
    
    // 操作人
    private Long createdBy;
    private Long updatedBy;
}