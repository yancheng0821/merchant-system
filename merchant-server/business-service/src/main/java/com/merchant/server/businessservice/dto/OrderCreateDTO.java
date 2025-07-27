package com.merchant.server.businessservice.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
    
    private Long resourceId;
    private String resourceType;
    
    @NotNull(message = "Services are required")
    private List<OrderServiceCreateDTO> services;
    
    @Positive(message = "Tax rate must be positive")
    private Double taxRate = 0.0;
    
    @Positive(message = "Tip percentage must be positive")
    private Double tipPercentage = 0.0;
    
    private String notes;
}