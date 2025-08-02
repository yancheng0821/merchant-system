package com.merchant.server.businessservice.dto;

import com.merchant.server.common.util.CurrencyUtils;
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
    
    // Mock模式标志（用于测试环境）
    private Boolean mockMode = false;
    
    /**
     * 设置金额时自动标准化，处理前端浮点数精度问题
     */
    public void setAmount(BigDecimal amount) {
        this.amount = CurrencyUtils.normalizeAmount(amount);
    }
    
    /**
     * 设置小费金额时自动标准化
     */
    public void setTipAmount(BigDecimal tipAmount) {
        this.tipAmount = CurrencyUtils.normalizeAmount(tipAmount);
    }
    
    /**
     * 设置现金收款金额时自动标准化
     */
    public void setCashReceived(BigDecimal cashReceived) {
        this.cashReceived = CurrencyUtils.normalizeAmount(cashReceived);
    }
}