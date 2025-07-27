package com.merchant.server.businessservice.dto.pos;

import lombok.Data;
import lombok.Builder;
import java.time.LocalDateTime;

/**
 * POS取消交易响应
 */
@Data
@Builder
public class POSCancelResponse {
    private String transactionId;
    private boolean success;
    private String status;
    private String message;
    private LocalDateTime cancelledAt;
}