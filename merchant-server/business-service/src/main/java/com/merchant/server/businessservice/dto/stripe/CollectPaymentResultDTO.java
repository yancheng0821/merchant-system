package com.merchant.server.businessservice.dto.stripe;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 收集支付方式结果DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectPaymentResultDTO {
    private String status;
    private String message;
    private String paymentMethodId;
    private String errorCode;
    private String errorMessage;
}