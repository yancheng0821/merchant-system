package com.merchant.server.businessservice.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

/**
 * 支付请求DTO
 */
@Data
public class PaymentRequestDTO {
    @NotNull(message = "Payment method is required")
    private String paymentMethod; // cash, credit_card, debit_card, mobile_pay
    
    @NotNull(message = "Terminal ID is required")
    private String terminalId;
    
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;
    
    private BigDecimal tipAmount;
    
    private String customerEmail;
    private String customerPhone;
    
    // 现金支付时的收款金额
    private BigDecimal cashReceived;
}