package com.merchant.server.authservice.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/auth/users/avatar")
public class AvatarController {
    
    private static final Logger logger = LoggerFactory.getLogger(AvatarController.class);
    
    @Value("${file.upload.path:/opt/merchant-system}")
    private String uploadBasePath;
    
    @Value("${APP_AVATAR_UPLOAD_PATH:}")
    private String avatarUploadPath;
    
    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> getAvatar(@PathVariable String filename) {
        logger.info("收到头像请求: {}", filename);
        
        try {
            // 使用配置的头像上传路径，如果为空则使用默认路径
            String basePath = (avatarUploadPath != null && !avatarUploadPath.trim().isEmpty()) 
                ? avatarUploadPath 
                : uploadBasePath + "/avatars";
            Path filePath = Paths.get(basePath).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists()) {
                logger.info("头像文件存在: {}", filePath);
                
                // 确定文件的内容类型
                String contentType = determineContentType(filename);
                
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                logger.warn("头像文件不存在: {}", filePath);
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            logger.error("头像文件URL格式错误: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    // 处理新格式的头像路径（包含租户信息）
    @GetMapping("/tenant_{tenantId}/{filename:.+}")
    public ResponseEntity<Resource> getAvatarWithTenant(
            @PathVariable Long tenantId,
            @PathVariable String filename) {
        logger.info("收到头像请求（带租户信息）: tenant_{}/{}", tenantId, filename);
        
        try {
            // 使用配置的头像上传路径，如果为空则使用默认路径
            String basePath = (avatarUploadPath != null && !avatarUploadPath.trim().isEmpty()) 
                ? avatarUploadPath 
                : uploadBasePath + "/avatars";
            Path filePath = Paths.get(basePath).resolve("tenant_" + tenantId).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists()) {
                logger.info("头像文件存在: {}", filePath);
                
                String contentType = determineContentType(filename);
                
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                logger.warn("头像文件不存在: {}", filePath);
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            logger.error("头像文件URL格式错误: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    private String determineContentType(String filename) {
        if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (filename.toLowerCase().endsWith(".png")) {
            return "image/png";
        } else if (filename.toLowerCase().endsWith(".gif")) {
            return "image/gif";
        } else if (filename.toLowerCase().endsWith(".bmp")) {
            return "image/bmp";
        } else if (filename.toLowerCase().endsWith(".webp")) {
            return "image/webp";
        } else if (filename.toLowerCase().endsWith(".svg")) {
            return "image/svg+xml";
        } else {
            return "application/octet-stream";
        }
    }
}