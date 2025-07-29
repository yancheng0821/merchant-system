package com.merchant.server.businessservice.entity;

import java.time.LocalDateTime;

public class CustomerImportTemp {
    
    private Long id;
    private Long tenantId;
    private String importSessionId;
    private Integer rowIndex;
    private String rawData;
    private ImportStatus status = ImportStatus.PENDING;
    private String errorMessage;
    private LocalDateTime createdAt;
    
    public enum ImportStatus {
        PENDING, VALID, INVALID, IMPORTED
    }
    
    // 构造函数
    public CustomerImportTemp() {
        this.createdAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getTenantId() {
        return tenantId;
    }
    
    public void setTenantId(Long tenantId) {
        this.tenantId = tenantId;
    }
    
    public String getImportSessionId() {
        return importSessionId;
    }
    
    public void setImportSessionId(String importSessionId) {
        this.importSessionId = importSessionId;
    }
    
    public Integer getRowIndex() {
        return rowIndex;
    }
    
    public void setRowIndex(Integer rowIndex) {
        this.rowIndex = rowIndex;
    }
    
    public String getRawData() {
        return rawData;
    }
    
    public void setRawData(String rawData) {
        this.rawData = rawData;
    }
    
    public ImportStatus getStatus() {
        return status;
    }
    
    public void setStatus(ImportStatus status) {
        this.status = status;
    }
    
    public String getErrorMessage() {
        return errorMessage;
    }
    
    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}