package com.merchant.server.authservice.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PasswordResetToken {

    private Long id;

    private Long userId;

    private String token;

    private LocalDateTime expiryTime;

    private Boolean used;

    private LocalDateTime createdAt;

    private LocalDateTime usedAt;
}
