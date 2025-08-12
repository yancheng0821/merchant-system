package com.merchant.server.businessservice.entity;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Stripe支付意图实体
 */
@Data
public class StripePaymentIntent {
    private Long id;
    private Long tenantId;
    private Long orderId;
    private String stripeAccountId;
    private String paymentIntentId;
    private String clientSecret;
    private Long amount;
    private String currency;
    private String status;
    private String paymentMethodId;
    private String paymentMethodType;
    private Long applicationFeeAmount;
    private String transferData; // JSON string
    private String metadata; // JSON string
    private String lastError; // JSON string
    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime canceledAt;
}