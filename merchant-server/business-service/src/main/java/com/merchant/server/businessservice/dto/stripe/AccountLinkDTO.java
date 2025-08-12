package com.merchant.server.businessservice.dto.stripe;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * Stripe账户链接DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountLinkDTO {
    private String url;
    private LocalDateTime expiresAt;
    private String type;
}