package com.merchant.server.authservice.dto;

import lombok.Data;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

@Data
public class TenantInvitationCreateDTO {
    
    @NotNull(message = "{invitation.tenant.required}")
    private Long tenantId;
    
    @Min(value = 1, message = "{invitation.maxUses.min}")
    private Integer maxUses = 1;
    
    private LocalDateTime expiresAt;
}