package com.merchant.server.authservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    private String tenantCode;
    private String tenantName;
    private String timezone;
    private List<String> roles;
    private List<String> permissions;
    private LocalDateTime tokenExpireTime;
    private LocalDateTime lastLoginTime;
    private LocalDateTime createdAt;

    // 2FA相关字段
    private Boolean need2FA;
    private String phone;

    // 租户所有者标识
    @JsonProperty("isTenantOwner")
    private Boolean isTenantOwner;

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
        this.createdAt = user.getCreatedAt();
    }

    // 创建需要2FA验证的响应
    public static LoginResponse needTwoFactorAuth(User user, Long tenantId) {
        LoginResponse response = new LoginResponse();
        response.setNeed2FA(true);
        response.setUserId(user.getId());
        response.setPhone(maskPhone(user.getPhone()));
        response.setTenantId(tenantId);
        return response;
    }

    // 脱敏电话号码
    private static String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return phone;
        }
        // 保留后4位，其他用*替换
        int visibleDigits = 4;
        int maskLength = phone.length() - visibleDigits;
        String masked = "*".repeat(maskLength);
        return masked + phone.substring(maskLength);
    }
} 