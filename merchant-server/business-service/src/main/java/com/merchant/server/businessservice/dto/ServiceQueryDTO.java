package com.merchant.server.businessservice.dto;

import lombok.Data;

@Data
public class ServiceQueryDTO {
    
    private Long tenantId;
    
    private Long categoryId;
    
    private String status;
    
    private String searchTerm;
    
    private Integer page = 1;
    
    private Integer size = 10;
    
    public Integer getOffset() {
        return Math.max(0, (page - 1) * size);
    }
}