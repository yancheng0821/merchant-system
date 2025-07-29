package com.merchant.server.businessservice.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class CustomerImportDTO {
    
    // 文件上传响应
    public static class UploadResponse {
        private String importSessionId;
        private String fileName;
        private Integer totalRecords;
        private List<String> detectedColumns;
        private List<Map<String, Object>> sampleData;
        
        public UploadResponse() {}
        
        public String getImportSessionId() { return importSessionId; }
        public void setImportSessionId(String importSessionId) { this.importSessionId = importSessionId; }
        
        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }
        
        public Integer getTotalRecords() { return totalRecords; }
        public void setTotalRecords(Integer totalRecords) { this.totalRecords = totalRecords; }
        
        public List<String> getDetectedColumns() { return detectedColumns; }
        public void setDetectedColumns(List<String> detectedColumns) { this.detectedColumns = detectedColumns; }
        
        public List<Map<String, Object>> getSampleData() { return sampleData; }
        public void setSampleData(List<Map<String, Object>> sampleData) { this.sampleData = sampleData; }
    }
    
    // 字段映射请求
    public static class MappingRequest {
        private String importSessionId;
        private Map<String, String> fieldMapping; // 原始字段 -> 系统字段
        
        public MappingRequest() {}
        
        public String getImportSessionId() { return importSessionId; }
        public void setImportSessionId(String importSessionId) { this.importSessionId = importSessionId; }
        
        public Map<String, String> getFieldMapping() { return fieldMapping; }
        public void setFieldMapping(Map<String, String> fieldMapping) { this.fieldMapping = fieldMapping; }
    }
    
    // 预览响应
    public static class PreviewResponse {
        private String importSessionId;
        private Integer totalRecords;
        private Integer validRecords;
        private Integer invalidRecords;
        private List<PreviewRecord> records;
        private List<ValidationError> errors;
        
        public PreviewResponse() {}
        
        public String getImportSessionId() { return importSessionId; }
        public void setImportSessionId(String importSessionId) { this.importSessionId = importSessionId; }
        
        public Integer getTotalRecords() { return totalRecords; }
        public void setTotalRecords(Integer totalRecords) { this.totalRecords = totalRecords; }
        
        public Integer getValidRecords() { return validRecords; }
        public void setValidRecords(Integer validRecords) { this.validRecords = validRecords; }
        
        public Integer getInvalidRecords() { return invalidRecords; }
        public void setInvalidRecords(Integer invalidRecords) { this.invalidRecords = invalidRecords; }
        
        public List<PreviewRecord> getRecords() { return records; }
        public void setRecords(List<PreviewRecord> records) { this.records = records; }
        
        public List<ValidationError> getErrors() { return errors; }
        public void setErrors(List<ValidationError> errors) { this.errors = errors; }
    }
    
    // 预览记录
    public static class PreviewRecord {
        private Integer rowIndex;
        private Map<String, Object> data;
        private Boolean isValid;
        private List<String> errors;
        
        public PreviewRecord() {}
        
        public Integer getRowIndex() { return rowIndex; }
        public void setRowIndex(Integer rowIndex) { this.rowIndex = rowIndex; }
        
        public Map<String, Object> getData() { return data; }
        public void setData(Map<String, Object> data) { this.data = data; }
        
        public Boolean getIsValid() { return isValid; }
        public void setIsValid(Boolean isValid) { this.isValid = isValid; }
        
        public List<String> getErrors() { return errors; }
        public void setErrors(List<String> errors) { this.errors = errors; }
    }
    
    // 验证错误
    public static class ValidationError {
        private Integer rowIndex;
        private String field;
        private String message;
        private Object value;
        
        public ValidationError() {}
        
        public ValidationError(Integer rowIndex, String field, String message, Object value) {
            this.rowIndex = rowIndex;
            this.field = field;
            this.message = message;
            this.value = value;
        }
        
        public Integer getRowIndex() { return rowIndex; }
        public void setRowIndex(Integer rowIndex) { this.rowIndex = rowIndex; }
        
        public String getField() { return field; }
        public void setField(String field) { this.field = field; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public Object getValue() { return value; }
        public void setValue(Object value) { this.value = value; }
    }
    
    // 执行导入请求
    public static class ExecuteRequest {
        private String importSessionId;
        private Boolean skipInvalidRecords = true;
        
        public ExecuteRequest() {}
        
        public String getImportSessionId() { return importSessionId; }
        public void setImportSessionId(String importSessionId) { this.importSessionId = importSessionId; }
        
        public Boolean getSkipInvalidRecords() { return skipInvalidRecords; }
        public void setSkipInvalidRecords(Boolean skipInvalidRecords) { this.skipInvalidRecords = skipInvalidRecords; }
    }
    
    // 导入结果
    public static class ImportResult {
        private String importSessionId;
        private String status;
        private Integer totalRecords;
        private Integer successRecords;
        private Integer failedRecords;
        private String message;
        private LocalDateTime completedAt;
        
        public ImportResult() {}
        
        public String getImportSessionId() { return importSessionId; }
        public void setImportSessionId(String importSessionId) { this.importSessionId = importSessionId; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public Integer getTotalRecords() { return totalRecords; }
        public void setTotalRecords(Integer totalRecords) { this.totalRecords = totalRecords; }
        
        public Integer getSuccessRecords() { return successRecords; }
        public void setSuccessRecords(Integer successRecords) { this.successRecords = successRecords; }
        
        public Integer getFailedRecords() { return failedRecords; }
        public void setFailedRecords(Integer failedRecords) { this.failedRecords = failedRecords; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public LocalDateTime getCompletedAt() { return completedAt; }
        public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    }
    
    // 导入日志
    public static class ImportLogDTO {
        private Long id;
        private String importSessionId;
        private String fileName;
        private Integer totalRecords;
        private Integer successRecords;
        private Integer failedRecords;
        private String status;
        private String errorMessage;
        private LocalDateTime createdAt;
        private LocalDateTime completedAt;
        
        public ImportLogDTO() {}
        
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public String getImportSessionId() { return importSessionId; }
        public void setImportSessionId(String importSessionId) { this.importSessionId = importSessionId; }
        
        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }
        
        public Integer getTotalRecords() { return totalRecords; }
        public void setTotalRecords(Integer totalRecords) { this.totalRecords = totalRecords; }
        
        public Integer getSuccessRecords() { return successRecords; }
        public void setSuccessRecords(Integer successRecords) { this.successRecords = successRecords; }
        
        public Integer getFailedRecords() { return failedRecords; }
        public void setFailedRecords(Integer failedRecords) { this.failedRecords = failedRecords; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
        
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        
        public LocalDateTime getCompletedAt() { return completedAt; }
        public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    }
}