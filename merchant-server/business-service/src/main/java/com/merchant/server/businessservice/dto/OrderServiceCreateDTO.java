package com.merchant.server.businessservice.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * 创建订单服务明细DTO
 */
@Data
public class OrderServiceCreateDTO {
    @NotNull(message = "Service ID is required")
    private Long serviceId;

    @Positive(message = "Quantity must be positive")
    private Integer quantity = 1;

    // 资源分配信息现在是可选的
    private Long assignedResourceId;
    private String assignedResourceType;

    // Payment method for this service (for multi-service mixed payment scenarios)
    private String paymentMethod;

    // 服务实际应付金额（混合支付场景下，前端计算好的金额，包含税费分摊）
    private Double serviceAmount;

    // 礼品卡支付金额（混合支付场景下，单个服务的礼品卡金额）
    private Double giftCardAmount;

    // 礼品卡卡号
    private String giftCardNumber;

    // 补充支付方式（当礼品卡金额不足时使用）
    private String additionalPaymentMethod;

    // 补充支付金额（混合支付场景下，前端计算好的补充支付金额）
    private Double additionalPaymentAmount;
}