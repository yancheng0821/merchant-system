package com.merchant.server.authservice.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Role {
    
    private Long id;
    
    private Long tenantId;
    
    private String roleName;
    
    private String roleCode;
    
    private String description;
    
    private RoleStatus status;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    public enum RoleStatus {
        ACTIVE, INACTIVE
    }
}