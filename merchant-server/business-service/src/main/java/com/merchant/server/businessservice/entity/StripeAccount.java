package com.merchant.server.businessservice.entity;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Stripe Connect账户实体
 */
@Data
public class StripeAccount {
    private Long id;
    private Long tenantId;
    private String stripeAccountId;
    private String stripeUserId;
    private String accountType;
    
    // 账户状态
    private Boolean onboardingCompleted;
    private Boolean chargesEnabled;
    private Boolean payoutsEnabled;
    private Boolean detailsSubmitted;
    
    // 业务信息
    private String businessName;
    private String businessType;
    private String country;
    private String defaultCurrency;
    
    // URLs
    private String dashboardUrl;
    private String onboardingUrl;
    private String returnUrl;
    private String refreshUrl;
    
    // 元数据
    private String metadata; // JSON string
    
    // 审计字段
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;
    private Boolean deleted;
}