package com.merchant.server.merchantservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订阅计划实体类
 */
@Data
public class SubscriptionPlan {

    private Long id;

    private String planCode;

    private String planNameEn;

    private String planNameZh;

    private BigDecimal monthlyPrice;

    private BigDecimal yearlyPrice;

    private Integer maxUsers;

    private Integer maxStaff;

    private Integer maxAppointmentsPerMonth;

    private Integer trialDays;

    private Boolean isActive;

    /**
     * 功能配置JSON
     */
    private String features;

    /**
     * Stripe Product ID
     */
    private String stripeProductId;

    /**
     * Stripe 月付 Price ID
     */
    private String stripeMonthlyPriceId;

    /**
     * Stripe 年付 Price ID
     */
    private String stripeYearlyPriceId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
