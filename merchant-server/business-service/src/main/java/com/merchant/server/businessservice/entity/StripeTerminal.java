package com.merchant.server.businessservice.entity;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Stripe Terminal设备实体
 */
@Data
public class StripeTerminal {
    private Long id;
    private Long tenantId;
    private String stripeAccountId;
    private String terminalId;
    private String label;
    private String deviceType;
    private String serialNumber;
    private String locationId;
    private String status;
    private LocalDateTime lastSeenAt;
    private String ipAddress;
    private String config; // JSON string
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean deleted;
}