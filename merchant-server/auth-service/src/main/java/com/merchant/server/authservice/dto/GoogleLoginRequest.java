package com.merchant.server.authservice.dto;

import jakarta.validation.constraints.NotBlank;

public class GoogleLoginRequest {
    
    @NotBlank(message = "Google ID Token不能为空")
    private String idToken;
    
    // 可选的租户代码，用于多租户场景
    private String tenantCode;
    
    public String getIdToken() {
        return idToken;
    }
    
    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }
    
    public String getTenantCode() {
        return tenantCode;
    }
    
    public void setTenantCode(String tenantCode) {
        this.tenantCode = tenantCode;
    }
    
    @Override
    public String toString() {
        return "GoogleLoginRequest{" +
                "idToken='" + (idToken != null ? idToken.substring(0, Math.min(20, idToken.length())) + "..." : null) + '\'' +
                ", tenantCode='" + tenantCode + '\'' +
                '}';
    }
}