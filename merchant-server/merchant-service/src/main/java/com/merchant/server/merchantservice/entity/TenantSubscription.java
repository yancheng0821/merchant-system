package com.merchant.server.merchantservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 商户订阅实体类
 */
@Data
public class TenantSubscription {

    /**
     * 计费周期枚举
     */
    public enum BillingCycle {
        MONTHLY,  // 月付
        YEARLY    // 年付
    }

    /**
     * 订阅状态枚举
     */
    public enum SubscriptionStatus {
        TRIAL,      // 试用
        ACTIVE,     // 活跃
        PAST_DUE,   // 逾期
        CANCELLED,  // 已取消
        EXPIRED     // 过期
    }

    private Long id;

    private Long tenantId;

    private Long planId;

    private BillingCycle billingCycle;

    private SubscriptionStatus status;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate trialStartDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate trialEndDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate currentPeriodStart;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate currentPeriodEnd;

    private String stripeSubscriptionId;

    private String stripeCustomerId;

    // 注意：pendingPlanId, pendingBillingCycle, pendingPlanEffectiveDate 字段已移除
    // 计划变更现在由 Stripe Subscription Schedules 管理，通过 API 获取

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    /**
     * 关联的订阅计划信息
     */
    private SubscriptionPlan plan;
}
