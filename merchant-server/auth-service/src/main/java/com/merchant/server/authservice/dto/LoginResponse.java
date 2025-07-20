package com.merchant.server.authservice.dto;

import com.merchant.server.authservice.entity.User;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class LoginResponse {
    
    private String token;
    private String refreshToken;
    private Long userId;
    private String username;
    private String realName;
    private String email;
    private String avatar;
    private Long tenantId;
    private String tenantName;
    private List<String> roles;
    private List<String> permissions;
    private LocalDateTime tokenExpireTime;
    private LocalDateTime lastLoginTime;
    
    public LoginResponse() {}
    
    public LoginResponse(String token, String refreshToken, User user) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.userId = user.getId();
        this.username = user.getUsername();
        this.realName = user.getRealName();
        this.email = user.getEmail();
        this.avatar = user.getAvatarUrl();
        this.tenantId = user.getTenantId();
        this.lastLoginTime = user.getLastLoginAt();
    }
} 