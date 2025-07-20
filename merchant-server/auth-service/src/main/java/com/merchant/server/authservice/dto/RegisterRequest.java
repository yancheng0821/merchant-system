package com.merchant.server.authservice.dto;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
public class RegisterRequest {
    
    @NotBlank(message = "{user.username.required}")
    @Size(min = 3, max = 50, message = "{user.username.length}")
    private String username;
    
    @NotBlank(message = "{user.password.required}")
    @Size(min = 6, max = 100, message = "{user.password.length}")
    private String password;
    
    @NotBlank(message = "{user.password.mismatch}")
    private String confirmPassword;
    
    @NotBlank(message = "{user.realname.required}")
    @Size(max = 100, message = "{user.realname.length}")
    private String realName;
    
    @Email(message = "{validation.email.invalid}")
    private String email;
    
    @Size(max = 20, message = "{user.phone.length}")
    private String phone;
    
    private String tenantCode;
} 