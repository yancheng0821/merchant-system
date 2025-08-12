package com.merchant.server.businessservice.dto.stripe;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;

/**
 * Stripe账户DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StripeAccountDTO {
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
    private Boolean isTestMode;
    
    // 业务信息
    private String businessName;
    private String businessType;
    private String country;
    private String defaultCurrency;
    
    // URLs
    private String dashboardUrl;
    private String onboardingUrl;
    
    // 账户验证要求
    private List<String> pendingVerification;
    private Boolean requiresAction;
    
    // 元数据
    private Map<String, Object> metadata;
    
    // 时间戳
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}