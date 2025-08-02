package com.merchant.server.authservice.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TenantInvitation {
    
    private Long id;
    
    private Long tenantId;
    
    private String invitationCode;
    
    private Long createdBy;
    
    private Integer maxUses;
    
    private Integer usedCount;
    
    private LocalDateTime expiresAt;
    
    private InvitationStatus status;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    public enum InvitationStatus {
        ACTIVE, EXPIRED, DISABLED
    }
    
    public boolean isValid() {
        if (status != InvitationStatus.ACTIVE) {
            return false;
        }
        
        if (expiresAt != null && expiresAt.isBefore(LocalDateTime.now())) {
            return false;
        }
        
        if (usedCount >= maxUses) {
            return false;
        }
        
        return true;
    }
}