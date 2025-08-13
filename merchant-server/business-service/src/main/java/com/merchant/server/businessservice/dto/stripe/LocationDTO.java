package com.merchant.server.businessservice.dto.stripe;

import lombok.Builder;
import lombok.Data;

/**
 * Location DTO
 */
@Data
@Builder
public class LocationDTO {
    private String id;
    private String displayName;
    private Address address;
    
    @Data
    @Builder
    public static class Address {
        private String line1;
        private String line2;
        private String city;
        private String state;
        private String country;
        private String postalCode;
    }
}