package com.merchant.server.businessservice.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * POS终端实体类
 */
@Data
public class POSTerminal {
    private Long id;
    
    private Long tenantId;
    private String terminalId;
    private String terminalName;
    private String posProvider;
    private String providerConfig;
    private String apiEndpoint;
    private String apiKey;
    private String merchantId;
    private String terminalStatus;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}