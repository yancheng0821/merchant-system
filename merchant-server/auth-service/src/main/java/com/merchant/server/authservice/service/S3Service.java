package com.merchant.server.authservice.service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;

@Slf4j
@Service
public class S3Service {

    @Value("${aws.s3.bucket-name:}")
    private String bucketName;

    @Value("${aws.s3.region:ca-central-1}")
    private String region;

    @Value("${aws.s3.url-expiration-hours:24}")
    private int urlExpirationHours;

    private S3Client s3Client;

    @PostConstruct
    public void init() {
        if (bucketName != null && !bucketName.isEmpty()) {

            log.info("Initializing S3 client with bucket: {}, region: {}", bucketName, region);

            // 使用默认凭证提供者链
            // 优先级: 环境变量 -> EC2 Instance Profile -> ECS Task Role
            // 这样可以避免在配置文件中存储明文密钥
            this.s3Client = S3Client.builder()
                    .region(Region.of(region))
                    .build();  // 使用DefaultCredentialsProvider

            log.info("S3 client initialized successfully using default credentials provider");
        } else {
            log.warn("S3 bucket name not configured. S3 service will not be available.");
        }
    }

    @PreDestroy
    public void cleanup() {
        if (s3Client != null) {
            s3Client.close();
            log.info("S3 client closed");
        }
    }

    public boolean isConfigured() {
        return s3Client != null;
    }

    /**
     * Upload file to S3
     * @param file MultipartFile to upload
     * @param key S3 object key (file path in bucket)
     * @param contentType MIME type
     * @return S3 object URL
     */
    public String uploadFile(MultipartFile file, String key, String contentType) throws IOException {
        if (s3Client == null) {
            throw new IllegalStateException("S3 client not configured");
        }

        try {
            log.info("Uploading file to S3: bucket={}, key={}, size={}", bucketName, key, file.getSize());

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(contentType)
                    .contentLength(file.getSize())
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            String url = getPublicUrl(key);
            log.info("File uploaded successfully: {}", url);
            return url;

        } catch (S3Exception e) {
            log.error("Failed to upload file to S3: key={}, error={}", key, e.getMessage(), e);
            throw new IOException("Failed to upload file to S3: " + e.getMessage(), e);
        }
    }

    /**
     * Delete file from S3
     * @param key S3 object key
     */
    public void deleteFile(String key) {
        if (s3Client == null) {
            log.warn("S3 client not configured, cannot delete: {}", key);
            return;
        }

        try {
            log.info("Deleting file from S3: bucket={}, key={}", bucketName, key);

            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
            log.info("File deleted successfully: {}", key);

        } catch (S3Exception e) {
            log.error("Failed to delete file from S3: key={}, error={}", key, e.getMessage(), e);
        }
    }

    /**
     * Get public URL for S3 object
     * @param key S3 object key
     * @return Public URL
     */
    public String getPublicUrl(String key) {
        // Return CloudFront URL if configured, otherwise S3 URL
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);
    }

    /**
     * Generate presigned URL for temporary access
     * @param key S3 object key
     * @return Presigned URL valid for configured hours
     */
    public String generatePresignedUrl(String key) {
        if (s3Client == null) {
            throw new IllegalStateException("S3 client not configured");
        }

        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            // Note: Presigned URL generation requires additional AWS SDK dependencies
            // For now, returning public URL
            log.warn("Presigned URL not implemented, returning public URL for: {}", key);
            return getPublicUrl(key);

        } catch (S3Exception e) {
            log.error("Failed to generate presigned URL: key={}, error={}", key, e.getMessage(), e);
            return getPublicUrl(key);
        }
    }

    /**
     * Check if file exists in S3
     * @param key S3 object key
     * @return true if file exists
     */
    public boolean fileExists(String key) {
        if (s3Client == null) {
            return false;
        }

        try {
            HeadObjectRequest headObjectRequest = HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.headObject(headObjectRequest);
            return true;

        } catch (NoSuchKeyException e) {
            return false;
        } catch (S3Exception e) {
            log.error("Error checking file existence: key={}, error={}", key, e.getMessage());
            return false;
        }
    }
}
