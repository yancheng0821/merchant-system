package com.merchant.server.businessservice.entity;

import java.time.LocalDateTime;

public class CustomerImportLog {
    
    private Long id;
    private Long tenantId;
    private String importSessionId;
    private String fileName;
    private Integer totalRecords;
    private Integer successRecords;
    private Integer failedRecords;
    private ImportStatus status = ImportStatus.PROCESSING;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    
    public enum ImportStatus {
        PROCESSING, COMPLETED, FAILED
    }
    
    // 构造函数
    public CustomerImportLog() {
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
    
    public String getFileName() {
        return fileName;
    }
    
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
    
    public Integer getTotalRecords() {
        return totalRecords;
    }
    
    public void setTotalRecords(Integer totalRecords) {
        this.totalRecords = totalRecords;
    }
    
    public Integer getSuccessRecords() {
        return successRecords;
    }
    
    public void setSuccessRecords(Integer successRecords) {
        this.successRecords = successRecords;
    }
    
    public Integer getFailedRecords() {
        return failedRecords;
    }
    
    public void setFailedRecords(Integer failedRecords) {
        this.failedRecords = failedRecords;
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
    
    public LocalDateTime getCompletedAt() {
        return completedAt;
    }
    
    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }
}