package com.merchant.server.businessservice.dto;

import com.merchant.server.businessservice.entity.MembershipTier;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 订单DTO
 */
@Data
public class OrderDTO {
    private Long id;
    private Long tenantId;
    private String orderNumber;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private MembershipTier customerMembershipTier; // Customer's membership tier
    private Long appointmentId;
    private Long resourceId;
    private String resourceName;
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
    
    // 订单服务明细
    private List<OrderServiceDTO> services;
    
    // 计算属性
    private String statusDisplay;
    private String paymentMethodDisplay;
}