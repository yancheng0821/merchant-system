package com.merchant.server.authservice.dto;

public class AvatarUploadResponse {
    
    private Long userId;
    private String avatarUrl;
    private String originalFileName;
    private Long fileSize;
    private String fileType;
    
    // Getters and Setters
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public String getAvatarUrl() {
        return avatarUrl;
    }
    
    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
    
    public String getOriginalFileName() {
        return originalFileName;
    }
    
    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }
    
    public Long getFileSize() {
        return fileSize;
    }
    
    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }
    
    public String getFileType() {
        return fileType;
    }
    
    public void setFileType(String fileType) {
        this.fileType = fileType;
    }
    
    @Override
    public String toString() {
        return "AvatarUploadResponse{" +
                "userId=" + userId +
                ", avatarUrl='" + avatarUrl + '\'' +
                ", originalFileName='" + originalFileName + '\'' +
                ", fileSize=" + fileSize +
                ", fileType='" + fileType + '\'' +
                '}';
    }
} 