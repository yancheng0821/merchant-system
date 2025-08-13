package com.merchant.server.businessservice.dto.stripe;

import lombok.Data;

/**
 * 创建Location请求
 */
@Data
public class CreateLocationRequest {
    private String displayName;
    private LocationAddress address;
    
    @Data
    public static class LocationAddress {
        private String line1;
        private String line2;
        private String city;
        private String state;
        private String country;
        private String postalCode;
    }
}