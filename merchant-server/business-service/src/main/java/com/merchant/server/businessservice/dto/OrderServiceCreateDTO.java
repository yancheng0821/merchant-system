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
}