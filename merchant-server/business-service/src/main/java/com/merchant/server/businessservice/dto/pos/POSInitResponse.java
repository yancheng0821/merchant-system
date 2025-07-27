package com.merchant.server.businessservice.dto.pos;

import lombok.Data;
import lombok.Builder;
import java.time.LocalDateTime;

/**
 * POS支付初始化响应
 */
@Data
@Builder
public class POSInitResponse {
    private String transactionId;
    private String status; // initiated, pending, processing
    private String terminalStatus; // ready, busy, offline
    private String message;
    private LocalDateTime initiatedAt;
    
    // 可选字段 - 用于某些需要额外步骤的POS系统
    private String actionRequired; // insert_card, enter_pin, sign
    private String displayMessage; // 显示给客户的消息
    private Integer timeout; // 超时时间（秒）
}