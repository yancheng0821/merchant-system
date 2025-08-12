package com.merchant.server.businessservice.dto.stripe;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Map;

/**
 * 创建支付意图请求
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaymentIntentRequest {
    private Long orderId;
    
    private Long amount; // 金额（分）
    
    private String currency = "CAD";
    
    private String paymentMethodType = "card_present";
    
    private String description;
    
    // 客户信息
    private String customerEmail;
    private String customerPhone;
    
    // 平台费用
    private Long applicationFeeAmount;
    
    // 元数据
    private Map<String, String> metadata;
}