package com.merchant.server.businessservice.dto.stripe;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * 处理支付结果DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessPaymentResultDTO {
    private String status;
    private String paymentIntentId;
    private String paymentMethodId;
    private Long amount;
    private String currency;
    private String message;
    private String authorizationCode;
    private String cardLast4;
    private String cardBrand;
    private LocalDateTime processedAt;
    private String errorCode;
    private String errorMessage;
}