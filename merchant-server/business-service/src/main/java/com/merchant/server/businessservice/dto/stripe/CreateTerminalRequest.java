package com.merchant.server.businessservice.dto.stripe;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 创建Terminal请求
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTerminalRequest {
    private String label;
    
    private String registrationCode;
    
    private String locationId;
    
    private String deviceType = "bbpos_wisepos_e";
}