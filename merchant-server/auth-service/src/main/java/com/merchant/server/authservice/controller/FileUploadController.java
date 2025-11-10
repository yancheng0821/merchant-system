package com.merchant.server.authservice.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth/files")
public class FileUploadController {

    @Value("${file.upload.path:/tmp/uploads}")
    private String uploadBasePath;

    @Value("${server.port:8080}")
    private String serverPort;

    @PostMapping("/upload/avatar")
    public ResponseEntity<Map<String, String>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            @RequestParam("tenantId") Long tenantId) {
        
        return uploadFile(file, tenantId, "avatars");
    }

    @PostMapping("/upload/room-icon")
    public ResponseEntity<Map<String, String>> uploadRoomIcon(
            @RequestParam("file") MultipartFile file,
            @RequestParam("tenantId") Long tenantId) {
        
        return uploadFile(file, tenantId, "room-icons");
    }

    private ResponseEntity<Map<String, String>> uploadFile(MultipartFile file, Long tenantId, String subDir) {
        try {
            // Log the upload paths for debugging
            System.out.println("=== FILE UPLOAD DEBUG ===");
            System.out.println("uploadBasePath: " + uploadBasePath);
            System.out.println("subDir: " + subDir);
            System.out.println("tenantId: " + tenantId);
            
            // 验证文件
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("文件不能为空"));
            }

            // 验证文件类型
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(createErrorResponse("只支持图片文件"));
            }

            // 验证文件大小 (5MB)
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(createErrorResponse("文件大小不能超过5MB"));
            }

            // 创建目录结构: {uploadBasePath}/{subDir}/tenant_{tenantId}/
            String tenantDir = "tenant_" + tenantId;
            Path uploadDir = Paths.get(uploadBasePath, subDir, tenantDir);
            System.out.println("Creating directory: " + uploadDir.toString());
            Files.createDirectories(uploadDir);

            // 生成唯一文件名
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";
            String filename = UUID.randomUUID().toString() + extension;

            // 保存文件
            Path filePath = uploadDir.resolve(filename);
            System.out.println("Saving file to: " + filePath.toString());
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // 生成访问URL - 使用静态资源路径
            String fileUrl = String.format("/static/uploads/%s/%s/%s", subDir, tenantDir, filename);

            Map<String, String> response = new HashMap<>();
            response.put("url", fileUrl);
            response.put("filename", filename);
            response.put("originalName", originalFilename);
            response.put("size", String.valueOf(file.getSize()));

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(createErrorResponse("文件上传失败: " + e.getMessage()));
        }
    }

    // 文件读取由Spring Boot的WebConfig静态资源处理器负责，无需此方法

    @DeleteMapping("/delete")
    public ResponseEntity<Map<String, String>> deleteFile(@RequestBody Map<String, String> request) {
        try {
            String fileUrl = request.get("fileUrl");
            if (fileUrl == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("文件URL不能为空"));
            }

            // 支持两种URL格式:
            // 1. /static/uploads/{subDir}/{tenantDir}/{filename}
            // 2. 完整的HTTP URL
            String relativePath;
            if (fileUrl.startsWith("/static/uploads/")) {
                relativePath = fileUrl.substring("/static/uploads/".length());
            } else if (fileUrl.contains("/static/uploads/")) {
                int index = fileUrl.indexOf("/static/uploads/");
                relativePath = fileUrl.substring(index + "/static/uploads/".length());
            } else {
                return ResponseEntity.badRequest().body(createErrorResponse("无效的文件URL格式"));
            }

            Path filePath = Paths.get(uploadBasePath, relativePath);

            // 安全检查：确保文件路径在上传目录内
            if (!filePath.normalize().startsWith(Paths.get(uploadBasePath).normalize())) {
                return ResponseEntity.badRequest().body(createErrorResponse("非法的文件路径"));
            }

            if (Files.exists(filePath)) {
                Files.delete(filePath);
                Map<String, String> response = new HashMap<>();
                response.put("message", "文件删除成功");
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(createErrorResponse("文件删除失败: " + e.getMessage()));
        }
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return error;
    }
}