package com.merchant.server.authservice.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Tenant {
    
    private Long id;
    
    private String tenantCode;
    
    private String tenantName;
    
    private TenantType tenantType;
    
    private Long parentTenantId;
    
    private TenantStatus status;
    
    private String contactPerson;
    
    private String contactPhone;
    
    private String contactEmail;
    
    private String address;
    
    private String businessLicense;
    
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    /**
     * 租户所有者用户ID（商户注册时创建的管理员账户）
     */
    private Long ownerUserId;

    public enum TenantType {
        CHAIN, BRANCH, INDEPENDENT
    }
    
    public enum TenantStatus {
        ACTIVE, INACTIVE, SUSPENDED
    }
} 