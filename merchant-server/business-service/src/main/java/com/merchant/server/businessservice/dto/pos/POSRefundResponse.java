package com.merchant.server.businessservice.dto.pos;

import lombok.Data;
import lombok.Builder;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * POS退款响应
 */
@Data
@Builder
public class POSRefundResponse {
    private String refundTransactionId;
    private String originalTransactionId;
    private boolean success;
    private String status;
    private BigDecimal refundedAmount;
    private String message;
    private LocalDateTime refundedAt;
}