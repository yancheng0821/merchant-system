package com.merchant.server.authservice.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class InvitationUsageLog {
    
    private Long id;
    
    private Long invitationId;
    
    private Long userId;
    
    private LocalDateTime usedAt;
}