package com.merchant.server.businessservice.dto.stripe;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * 退款DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RefundDTO {
    private String refundId;
    private String paymentIntentId;
    private Long amount;
    private String currency;
    private String status;
    private String reason;
    private String failureReason;
    private Map<String, String> metadata;
    private LocalDateTime createdAt;
}