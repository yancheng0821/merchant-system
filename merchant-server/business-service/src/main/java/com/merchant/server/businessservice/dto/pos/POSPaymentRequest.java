package com.merchant.server.businessservice.dto.pos;

import lombok.Data;
import lombok.Builder;
import java.math.BigDecimal;
import java.util.Map;

/**
 * POS支付请求
 */
@Data
@Builder
public class POSPaymentRequest {
    private String orderId;
    private String terminalId;
    private BigDecimal amount;
    private String currency;
    private String paymentMethod; // credit_card, debit_card, mobile_pay
    private String description;
    private Map<String, String> metadata;
    
    // 可选字段
    private BigDecimal tipAmount;
    private BigDecimal taxAmount;
    private String customerEmail;
    private String customerPhone;
}