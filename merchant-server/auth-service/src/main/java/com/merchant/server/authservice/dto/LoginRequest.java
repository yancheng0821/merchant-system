package com.merchant.server.authservice.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class LoginRequest {
    
    @NotBlank(message = "{user.username.required}")
    private String username;
    
    @NotBlank(message = "{user.password.required}")
    private String password;
    
    private String tenantCode;
    
    private Boolean rememberMe = false;
} 