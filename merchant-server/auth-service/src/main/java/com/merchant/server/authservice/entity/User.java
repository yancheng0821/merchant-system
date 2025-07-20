package com.merchant.server.authservice.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class User {
    
    private Long id;
    
    private Long tenantId;
    
    private String username;
    
    private String email;
    
    private String phone;
    
    private String passwordHash;
    
    private String salt;
    
    private String realName;
    
    private String avatarUrl;
    
    private UserStatus status;
    
    private LocalDateTime lastLoginAt;
    
    private String lastLoginIp;
    
    private Integer loginAttempts;
    
    private LocalDateTime lockedUntil;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    public enum UserStatus {
        ACTIVE, INACTIVE, LOCKED
    }
} 