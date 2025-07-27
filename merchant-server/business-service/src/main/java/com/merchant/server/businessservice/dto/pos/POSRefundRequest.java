package com.merchant.server.businessservice.dto.pos;

import lombok.Data;
import lombok.Builder;
import java.math.BigDecimal;

/**
 * POS退款请求
 */
@Data
@Builder
public class POSRefundRequest {
    private String originalTransactionId;
    private String orderId;
    private BigDecimal refundAmount;
    private String reason;
    private String terminalId;
}