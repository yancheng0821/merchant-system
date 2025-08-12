package com.merchant.server.businessservice.dto.stripe;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 创建Stripe账户请求
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateStripeAccountRequest {
    private String businessName;
    
    private String businessType;
    
    private String email;
    
    private String country = "CA";
    
    private String defaultCurrency = "CAD";
    
    private String accountType = "express";
    
    // 预填充的商户信息
    private String phone;
    private String address;
    private String city;
    private String state;
    private String postalCode;
    
    // 联系人信息
    private String contactPerson;
    private String firstName;
    private String lastName;
    
    // 业务信息
    private String productDescription;
    private String mcc; // Merchant Category Code (e.g., "7230" for beauty salons)
    private String website;
    
    // 银行账户信息（可选）
    private String bankAccountNumber;
    private String routingNumber;
    
    // 商户详细信息
    private BusinessProfile businessProfile;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BusinessProfile {
        private String mcc; // Merchant Category Code
        private String productDescription;
        private String supportPhone;
        private String supportEmail;
        private String url;
    }
}