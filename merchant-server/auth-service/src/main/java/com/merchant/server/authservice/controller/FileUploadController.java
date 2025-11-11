package com.merchant.server.authservice.controller;

import com.merchant.server.authservice.service.S3Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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

@Slf4j
@RestController
@RequestMapping("/api/auth/files")
public class FileUploadController {

    @Value("${file.upload.path:/var/uploads}")
    private String uploadBasePath;

    @Value("${server.port:8080}")
    private String serverPort;

    @Value("${file.upload.mode:s3}")
    private String uploadMode;  // local, s3, or dual

    @Autowired(required = false)
    private S3Service s3Service;

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
            log.info("=== FILE UPLOAD ===");
            log.info("Upload mode: {}", uploadMode);
            log.info("subDir: {}, tenantId: {}, file: {}", subDir, tenantId, file.getOriginalFilename());

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

            // 生成文件名和路径
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";
            String filename = UUID.randomUUID().toString() + extension;
            String tenantDir = "tenant_" + tenantId;

            String fileUrl = null;

            // S3 上传模式
            if ("s3".equals(uploadMode) || "dual".equals(uploadMode)) {
                if (s3Service != null && s3Service.isConfigured()) {
                    try {
                        // S3 key: uploads/{subDir}/tenant_{tenantId}/{filename}
                        String s3Key = String.format("uploads/%s/%s/%s", subDir, tenantDir, filename);
                        fileUrl = s3Service.uploadFile(file, s3Key, contentType);
                        log.info("File uploaded to S3: {}", fileUrl);

                        // 如果是纯S3模式，直接返回
                        if ("s3".equals(uploadMode)) {
                            Map<String, String> response = new HashMap<>();
                            response.put("url", fileUrl);
                            response.put("filename", filename);
                            response.put("originalName", originalFilename);
                            response.put("size", String.valueOf(file.getSize()));
                            response.put("storageMode", "s3");
                            return ResponseEntity.ok(response);
                        }
                    } catch (IOException e) {
                        log.error("Failed to upload to S3: {}", e.getMessage());
                        if ("s3".equals(uploadMode)) {
                            return ResponseEntity.internalServerError().body(createErrorResponse("S3上传失败: " + e.getMessage()));
                        }
                        // 如果是dual模式，继续本地上传
                    }
                } else {
                    log.warn("S3 service not configured, falling back to local storage");
                    if ("s3".equals(uploadMode)) {
                        return ResponseEntity.internalServerError().body(createErrorResponse("S3服务未配置"));
                    }
                }
            }

            // 本地上传模式（local或dual的fallback）
            if ("local".equals(uploadMode) || "dual".equals(uploadMode) || fileUrl == null) {
                Path uploadDir = Paths.get(uploadBasePath, subDir, tenantDir);
                log.info("Creating local directory: {}", uploadDir.toString());
                Files.createDirectories(uploadDir);

                Path filePath = uploadDir.resolve(filename);
                log.info("Saving file to: {}", filePath.toString());
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                String localUrl = String.format("/static/uploads/%s/%s/%s", subDir, tenantDir, filename);

                Map<String, String> response = new HashMap<>();
                response.put("url", "dual".equals(uploadMode) && fileUrl != null ? fileUrl : localUrl);
                response.put("localUrl", localUrl);
                if (fileUrl != null) {
                    response.put("s3Url", fileUrl);
                }
                response.put("filename", filename);
                response.put("originalName", originalFilename);
                response.put("size", String.valueOf(file.getSize()));
                response.put("storageMode", uploadMode);

                return ResponseEntity.ok(response);
            }

            return ResponseEntity.internalServerError().body(createErrorResponse("文件上传失败"));

        } catch (IOException e) {
            log.error("File upload failed", e);
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

            log.info("Deleting file: {}, mode: {}", fileUrl, uploadMode);
            boolean deleted = false;

            // 如果是S3 URL (包含 s3.amazonaws.com 或自定义域名)
            if (fileUrl.contains("s3.") || fileUrl.contains("amazonaws.com")) {
                if (s3Service != null && s3Service.isConfigured()) {
                    try {
                        // 从S3 URL提取key: https://bucket.s3.region.amazonaws.com/uploads/...
                        String s3Key = extractS3Key(fileUrl);
                        if (s3Key != null) {
                            s3Service.deleteFile(s3Key);
                            deleted = true;
                            log.info("File deleted from S3: {}", s3Key);
                        }
                    } catch (Exception e) {
                        log.error("Failed to delete from S3: {}", e.getMessage());
                        if ("s3".equals(uploadMode)) {
                            return ResponseEntity.internalServerError().body(createErrorResponse("S3删除失败: " + e.getMessage()));
                        }
                    }
                }
            }

            // 本地文件删除（支持两种URL格式）
            if ("local".equals(uploadMode) || "dual".equals(uploadMode) || !deleted) {
                String relativePath = null;
                if (fileUrl.startsWith("/static/uploads/")) {
                    relativePath = fileUrl.substring("/static/uploads/".length());
                } else if (fileUrl.contains("/static/uploads/")) {
                    int index = fileUrl.indexOf("/static/uploads/");
                    relativePath = fileUrl.substring(index + "/static/uploads/".length());
                }

                if (relativePath != null) {
                    Path filePath = Paths.get(uploadBasePath, relativePath);

                    // 安全检查：确保文件路径在上传目录内
                    if (!filePath.normalize().startsWith(Paths.get(uploadBasePath).normalize())) {
                        return ResponseEntity.badRequest().body(createErrorResponse("非法的文件路径"));
                    }

                    if (Files.exists(filePath)) {
                        Files.delete(filePath);
                        deleted = true;
                        log.info("File deleted from local storage: {}", filePath);
                    }
                }
            }

            if (deleted) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "文件删除成功");
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (IOException e) {
            log.error("File deletion failed", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("文件删除失败: " + e.getMessage()));
        }
    }

    private String extractS3Key(String s3Url) {
        try {
            // S3 URL格式: https://bucket.s3.region.amazonaws.com/key
            // 提取 key 部分
            if (s3Url.contains("amazonaws.com/")) {
                int index = s3Url.indexOf("amazonaws.com/");
                return s3Url.substring(index + "amazonaws.com/".length());
            }
        } catch (Exception e) {
            log.error("Failed to extract S3 key from URL: {}", s3Url, e);
        }
        return null;
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return error;
    }
}