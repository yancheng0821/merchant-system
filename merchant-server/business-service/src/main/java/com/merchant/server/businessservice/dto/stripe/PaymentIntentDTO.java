package com.merchant.server.businessservice.dto.stripe;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * 支付意图DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaymentIntentDTO {
    private String paymentIntentId;
    private String clientSecret;
    private Long amount;
    private String currency;
    private String status;
    private String paymentMethodId;
    private String paymentMethodType;
    private Long applicationFeeAmount;
    private Map<String, String> metadata;
    private String lastError;
    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime canceledAt;
}