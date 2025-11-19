package com.merchant.server.businessservice.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

/**
 * 更新订单支付方式请求DTO
 */
@Data
public class UpdatePaymentMethodRequest {

    /**
     * 新的支付方式
     */
    @NotBlank(message = "Payment method is required")
    private String newPaymentMethod;

    /**
     * 修改原因
     */
    @NotBlank(message = "Reason is required")
    private String reason;
}
