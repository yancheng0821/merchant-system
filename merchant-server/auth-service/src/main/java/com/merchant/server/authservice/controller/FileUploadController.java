package com.merchant.server.authservice.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
public class FileUploadController {

    @Value("${file.upload.path:/opt/merchant-system}")
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

            // 创建目录结构: /opt/merchant-system/avatars/tenant_{tenantId}/
            String tenantDir = "tenant_" + tenantId;
            Path uploadDir = Paths.get(uploadBasePath, subDir, tenantDir);
            Files.createDirectories(uploadDir);

            // 生成唯一文件名
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";
            String filename = UUID.randomUUID().toString() + extension;

            // 保存文件
            Path filePath = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // 生成访问URL
            String fileUrl = String.format("/api/files/%s/%s/%s", subDir, tenantDir, filename);

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

    @GetMapping("/{subDir}/{tenantDir}/{filename}")
    public ResponseEntity<byte[]> getFile(
            @PathVariable String subDir,
            @PathVariable String tenantDir,
            @PathVariable String filename) {
        
        try {
            Path filePath = Paths.get(uploadBasePath, subDir, tenantDir, filename);
            
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }

            byte[] fileContent = Files.readAllBytes(filePath);
            
            // 根据文件扩展名设置Content-Type
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .header("Cache-Control", "max-age=3600") // 缓存1小时
                    .body(fileContent);

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<Map<String, String>> deleteFile(@RequestBody Map<String, String> request) {
        try {
            String fileUrl = request.get("fileUrl");
            if (fileUrl == null || !fileUrl.startsWith("/api/files/")) {
                return ResponseEntity.badRequest().body(createErrorResponse("无效的文件URL"));
            }

            // 解析文件路径: /api/files/{subDir}/{tenantDir}/{filename}
            String[] pathParts = fileUrl.split("/");
            if (pathParts.length < 6) {
                return ResponseEntity.badRequest().body(createErrorResponse("无效的文件路径"));
            }

            String subDir = pathParts[3];
            String tenantDir = pathParts[4];
            String filename = pathParts[5];

            Path filePath = Paths.get(uploadBasePath, subDir, tenantDir, filename);
            
            if (Files.exists(filePath)) {
                Files.delete(filePath);
            }

            Map<String, String> response = new HashMap<>();
            response.put("message", "文件删除成功");
            return ResponseEntity.ok(response);

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