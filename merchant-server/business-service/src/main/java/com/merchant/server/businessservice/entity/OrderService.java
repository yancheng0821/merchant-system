package com.merchant.server.businessservice.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 订单服务明细实体类
 */
@Data
public class OrderService {
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
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}