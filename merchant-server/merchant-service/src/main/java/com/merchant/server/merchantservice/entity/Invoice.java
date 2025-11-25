package com.merchant.server.merchantservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 账单实体类
 */
@Data
public class Invoice {

    /**
     * 账单状态枚举
     */
    public enum InvoiceStatus {
        PENDING,    // 待支付
        PAID,       // 已支付
        CANCELLED,  // 已取消
        REFUNDED    // 已退款
    }

    private Long id;

    private String invoiceNumber;

    private Long tenantId;

    private String tenantName;

    private Long subscriptionId;

    private BigDecimal subtotal;

    private BigDecimal taxRate;

    private BigDecimal taxAmount;

    private BigDecimal amount;

    private String currency;

    private String taxRegion;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate billingPeriodStart;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate billingPeriodEnd;

    private InvoiceStatus status;

    private String paymentMethod;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime paymentDate;

    private String stripeInvoiceId;

    private String stripePaymentIntentId;

    private String description;

    private String notes;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
