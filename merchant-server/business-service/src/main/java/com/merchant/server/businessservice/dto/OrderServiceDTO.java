package com.merchant.server.businessservice.dto;

import lombok.Data;

/**
 * 订单服务明细DTO
 */
@Data
public class OrderServiceDTO {
    private Long id;
    private Long orderId;
    private Long serviceId;
    private String serviceName;
    private String serviceCategory;
    private Double price;
    private Integer quantity;
    private Integer duration;
    private Long assignedResourceId;
    private String assignedResourceType;
    private String assignedResourceName;
    private String paymentMethod; // Payment method for this service (cash, credit_card, package, etc.)

    // 计算属性
    private Double totalPrice;
}