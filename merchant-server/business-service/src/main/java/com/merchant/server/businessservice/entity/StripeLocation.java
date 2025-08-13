package com.merchant.server.businessservice.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * Stripe Location实体
 */
@Data
public class StripeLocation {
    private Long id;
    private Long tenantId;
    private String stripeAccountId;
    private String locationId;
    
    // 位置信息
    private String displayName;
    
    // 地址信息
    private String addressLine1;
    private String addressLine2;
    private String addressCity;
    private String addressState;
    private String addressCountry;
    private String addressPostalCode;
    
    // 元数据
    private String metadata; // JSON string
    
    // 时间戳
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean deleted;
}