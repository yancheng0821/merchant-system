package com.merchant.server.businessservice.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Min;
import java.util.List;

/**
 * 创建订单DTO
 */
@Data
public class OrderCreateDTO {
    @NotNull(message = "Tenant ID is required")
    private Long tenantId;
    
    @NotNull(message = "Customer ID is required")
    private Long customerId;
    
    private Long appointmentId;
    
    // 资源ID和类型现在是可选的
    private Long resourceId;
    private String resourceType;
    
    @NotNull(message = "Services are required")
    @jakarta.validation.Valid
    private List<OrderServiceCreateDTO> services;
    
    @Min(value = 0, message = "Tax rate must be non-negative")
    private Double taxRate = 0.0;

    @Min(value = 0, message = "Tip amount must be non-negative")
    private Double tipAmount = 0.0;

    @Min(value = 0, message = "Tip percentage must be non-negative")
    private Double tipPercentage = 0.0;

    // Subtotal and totalAmount from frontend (already calculated excluding package payments)
    @Min(value = 0, message = "Subtotal must be non-negative")
    private Double subtotal;

    @Min(value = 0, message = "Total amount must be non-negative")
    private Double totalAmount;

    private String paymentMethod; // 支付方式
    private String tipPaymentMethod; // 小费支付方式
    private String paymentMode; // 支付模式: single(单服务), unified(多服务统一), mixed(多服务混合)

    // 礼品卡支付相关字段
    private Double giftCardAmount; // 礼品卡支付金额
    private String giftCardNumber; // 礼品卡号
    private String additionalPaymentMethod; // 礼品卡不足时的补充支付方式
    private Double additionalPaymentAmount; // 补充支付金额（前端计算好的，可能包含小费）

    private String notes;
}