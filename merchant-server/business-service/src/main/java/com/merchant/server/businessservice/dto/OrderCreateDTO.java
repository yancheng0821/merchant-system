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
    
    @Min(value = 0, message = "Tip percentage must be non-negative")
    private Double tipPercentage = 0.0;
    
    private String paymentMethod; // 支付方式
    
    private String notes;
}