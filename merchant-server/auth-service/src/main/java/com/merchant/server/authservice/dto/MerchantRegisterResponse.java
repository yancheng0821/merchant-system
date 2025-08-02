package com.merchant.server.authservice.dto;

import lombok.Data;

@Data
public class MerchantRegisterResponse {
    
    private String token;
    private String refreshToken;
    private Long userId;
    private String username;
    private String realName;
    private String email;
    private String avatar;
    private Long tenantId;
    private String tenantName;
    private Long merchantId;
    private String merchantName;
    private String invitationCode; // 自动生成的邀请码
    private String tenantCode; // 租户代码
    
    public MerchantRegisterResponse(String token, String refreshToken, Long userId, String username, 
                                  String realName, String email, String avatar, Long tenantId, 
                                  String tenantName, Long merchantId, String merchantName, String invitationCode, String tenantCode) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.userId = userId;
        this.username = username;
        this.realName = realName;
        this.email = email;
        this.avatar = avatar;
        this.tenantId = tenantId;
        this.tenantName = tenantName;
        this.merchantId = merchantId;
        this.merchantName = merchantName;
        this.invitationCode = invitationCode;
        this.tenantCode = tenantCode;
    }
}