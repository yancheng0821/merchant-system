package com.merchant.server.authservice.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MerchantSetting {
    
    private Long id;
    private Long merchantId;
    private String settingKey;
    private String settingValue;
    private String settingType;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public MerchantSetting() {}
    
    public MerchantSetting(Long merchantId, String settingKey, String settingValue, 
                          String settingType, String description) {
        this.merchantId = merchantId;
        this.settingKey = settingKey;
        this.settingValue = settingValue;
        this.settingType = settingType;
        this.description = description;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}