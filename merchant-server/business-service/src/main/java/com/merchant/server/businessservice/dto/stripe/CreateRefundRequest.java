package com.merchant.server.businessservice.dto.stripe;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 创建退款请求
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRefundRequest {
    private String paymentIntentId;
    
    private Long amount; // 退款金额（分），如果为空则全额退款
    
    private String reason; // duplicate, fraudulent, requested_by_customer
    
    private String description;
}