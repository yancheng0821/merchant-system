package com.merchant.server.businessservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.server.businessservice.dto.SendVerificationCodeRequest;
import com.merchant.server.businessservice.dto.VerificationCodeResponse;
import com.merchant.server.businessservice.dto.VerifyCodeRequest;
import com.merchant.server.businessservice.entity.VerificationCode;
import com.merchant.server.businessservice.mapper.VerificationCodeMapper;
import com.merchant.server.businessservice.util.MessageUtil;
import com.merchant.server.common.dto.NotificationMessage;
import com.merchant.server.common.dto.NotificationRequest;
import com.merchant.server.common.enums.NotificationScene;
import com.merchant.server.common.mq.NotificationMessageProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

/**
 * 通用验证码服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationCodeService {

    private final VerificationCodeMapper verificationCodeMapper;
    private final NotificationMQService notificationMQService;
    private final NotificationMessageProducer notificationMessageProducer;
    private final ObjectMapper objectMapper;
    private final MessageUtil messageUtil;

    @Value("${verification.code.length:6}")
    private Integer codeLength;

    @Value("${verification.code.expiry-minutes:5}")
    private Integer expiryMinutes;

    @Value("${verification.code.max-attempts:3}")
    private Integer maxAttempts;

    @Value("${verification.code.rate-limit.recipient-per-hour:5}")
    private Integer rateLimitRecipientPerHour;

    @Value("${verification.code.rate-limit.ip-per-hour:20}")
    private Integer rateLimitIpPerHour;

    /**
     * 发送验证码
     */
    @Transactional
    public VerificationCodeResponse sendVerificationCode(SendVerificationCodeRequest request) {
        log.info("Sending verification code - businessType: {}, recipient: {}",
                request.getBusinessType(), request.getRecipient());

        try {
            // 1. 验证请求参数
            validateRequest(request);

            // 2. 检查发送频率限制
            checkRateLimit(request);

            // 3. 生成验证码
            String code = generateVerificationCode();

            // 4. 创建验证码记录
            VerificationCode verificationCode = createVerificationCode(request, code);

            // 5. 先发送验证码（通过通知服务），发送成功后再保存到数据库
            boolean sent = sendCodeViaNotificationService(
                    request.getRecipient(),
                    code,
                    request.getBusinessType(),
                    request.getTenantId(),
                    request.getBusinessId(),
                    request.getMetadata()
            );

            if (!sent) {
                log.error("Failed to send verification code to recipient: {}", request.getRecipient());
                return VerificationCodeResponse.failure("Failed to send verification code, please try again later");
            }

            // 6. SMS发送成功后，保存到数据库
            verificationCodeMapper.insert(verificationCode);

            log.info("Verification code sent successfully - id: {}, recipient: {}",
                    verificationCode.getId(), request.getRecipient());

            return VerificationCodeResponse.success(
                    verificationCode.getId(),
                    "Verification code sent successfully",
                    expiryMinutes
            );

        } catch (IllegalArgumentException e) {
            log.warn("Validation failed: {}", e.getMessage());
            return VerificationCodeResponse.failure(e.getMessage());
        } catch (Exception e) {
            log.error("Error sending verification code", e);
            return VerificationCodeResponse.failure("Failed to send verification code: " + e.getMessage());
        }
    }

    /**
     * 验证验证码
     */
    @Transactional
    public VerificationCodeResponse verifyCode(VerifyCodeRequest request) {
        log.info("Verifying code - verificationId: {}", request.getVerificationId());

        try {
            // 1. 查询验证码记录
            VerificationCode verificationCode = verificationCodeMapper.selectById(request.getVerificationId());
            if (verificationCode == null) {
                return VerificationCodeResponse.verificationFailure(
                        messageUtil.getMessage("error.verification.code.not.found"), null);
            }

            // 2. 检查验证码状态
            if (!verificationCode.canVerify()) {
                String message;
                if (verificationCode.isExpired()) {
                    message = messageUtil.getMessage("error.verification.code.incorrect");
                } else if (verificationCode.isMaxAttemptsReached()) {
                    message = messageUtil.getMessage("error.verification.code.max.attempts");
                } else {
                    message = messageUtil.getMessage("error.verification.code.invalid.status");
                }
                return VerificationCodeResponse.verificationFailure(message, 0);
            }

            // 3. 验证验证码
            boolean isValid = verifyCodeHash(request.getCode(), verificationCode.getCodeHash());

            // 4. 增加尝试次数
            verificationCodeMapper.incrementAttempts(verificationCode.getId());

            if (isValid) {
                // 验证成功，更新状态
                verificationCodeMapper.updateStatus(
                        verificationCode.getId(),
                        VerificationCode.VerificationStatus.VERIFIED.name(),
                        LocalDateTime.now(ZoneOffset.UTC)
                );
                log.info("Verification successful - id: {}", verificationCode.getId());
                return VerificationCodeResponse.verificationSuccess(
                        messageUtil.getMessage("success.verification.code.verified")
                );
            } else {
                // 验证失败
                int remaining = verificationCode.getMaxAttempts() - verificationCode.getAttempts() - 1;
                log.warn("Verification failed - id: {}, remaining attempts: {}",
                        verificationCode.getId(), remaining);

                if (remaining <= 0) {
                    verificationCodeMapper.updateStatus(
                            verificationCode.getId(),
                            VerificationCode.VerificationStatus.FAILED.name(),
                            null
                    );
                    return VerificationCodeResponse.verificationFailure(
                            messageUtil.getMessage("error.verification.code.no.attempts"),
                            0
                    );
                }

                return VerificationCodeResponse.verificationFailure(
                        messageUtil.getMessage("error.verification.code.incorrect.with.attempts", new Object[]{remaining}),
                        remaining
                );
            }

        } catch (Exception e) {
            log.error("Error verifying code", e);
            return VerificationCodeResponse.failure(
                    messageUtil.getMessage("error.verification.failed", new Object[]{e.getMessage()}));
        }
    }

    /**
     * 获取最新的验证码（用于重新发送）
     */
    public VerificationCode getLatestVerificationCode(Long tenantId, String businessType, String businessId) {
        return verificationCodeMapper.selectLatestByBusiness(tenantId, businessType, businessId);
    }

    /**
     * 清理过期的验证码
     */
    @Transactional
    public void cleanupExpiredCodes() {
        log.info("Cleaning up expired verification codes");
        int count = verificationCodeMapper.expireOldCodes(LocalDateTime.now(ZoneOffset.UTC));
        log.info("Expired {} verification codes", count);
    }

    // ========== 私有辅助方法 ==========

    private void validateRequest(SendVerificationCodeRequest request) {
        if (request.getTenantId() == null) {
            throw new IllegalArgumentException("Tenant ID is required");
        }
        if (request.getBusinessType() == null || request.getBusinessType().trim().isEmpty()) {
            throw new IllegalArgumentException("Business type is required");
        }
        if (request.getRecipientType() == null || request.getRecipientType().trim().isEmpty()) {
            throw new IllegalArgumentException("Recipient type is required");
        }
        if (request.getRecipient() == null || request.getRecipient().trim().isEmpty()) {
            throw new IllegalArgumentException("Recipient is required");
        }

        // 验证手机号格式（简单验证）
        // 允许6位以上的手机号，以支持不同国家的号码格式
        if ("PHONE".equals(request.getRecipientType())) {
            String phone = request.getRecipient().replaceAll("[^0-9]", "");
            if (phone.length() < 6) {
                log.warn("手机号格式验证失败 - 原始: {}, 清理后: {}, 长度: {}",
                    request.getRecipient(), phone, phone.length());
                throw new IllegalArgumentException("Invalid phone number format");
            }
        }
    }

    private void checkRateLimit(SendVerificationCodeRequest request) {
        LocalDateTime oneHourAgo = LocalDateTime.now(ZoneOffset.UTC).minusHours(1);

        // 检查接收者发送频率
        int recipientCount = verificationCodeMapper.countRecentCodesByRecipient(
                request.getRecipientType(),
                request.getRecipient(),
                oneHourAgo
        );
        if (recipientCount >= rateLimitRecipientPerHour) {
            throw new IllegalArgumentException(messageUtil.getMessage("error.verification.code.rate.limit"));
        }

        // 检查IP发送频率
        if (request.getIpAddress() != null) {
            int ipCount = verificationCodeMapper.countRecentCodesByIp(
                    request.getIpAddress(),
                    oneHourAgo
            );
            if (ipCount >= rateLimitIpPerHour) {
                throw new IllegalArgumentException(messageUtil.getMessage("error.verification.code.rate.limit"));
            }
        }
    }

    private String generateVerificationCode() {
        Random random = new Random();
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < codeLength; i++) {
            code.append(random.nextInt(10));
        }
        return code.toString();
    }

    private VerificationCode createVerificationCode(SendVerificationCodeRequest request, String code) {
        VerificationCode verificationCode = new VerificationCode();
        verificationCode.setTenantId(request.getTenantId());
        verificationCode.setBusinessType(VerificationCode.BusinessType.valueOf(request.getBusinessType()));
        verificationCode.setBusinessId(request.getBusinessId());
        verificationCode.setRecipientType(VerificationCode.RecipientType.valueOf(request.getRecipientType()));
        verificationCode.setRecipient(request.getRecipient());
        verificationCode.setVerificationCode(code);
        verificationCode.setCodeHash(hashCode(code));
        verificationCode.setStatus(VerificationCode.VerificationStatus.PENDING);
        verificationCode.setAttempts(0);
        verificationCode.setMaxAttempts(maxAttempts);
        verificationCode.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        verificationCode.setExpiresAt(LocalDateTime.now(ZoneOffset.UTC).plusMinutes(expiryMinutes));
        verificationCode.setIpAddress(request.getIpAddress());
        verificationCode.setUserAgent(request.getUserAgent());
        verificationCode.setMetadata(request.getMetadata());
        return verificationCode;
    }

    private String hashCode(String code) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(code.getBytes());
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            log.error("Error hashing verification code", e);
            throw new RuntimeException(messageUtil.getMessage("error.verification.code.hash.failed"), e);
        }
    }

    private boolean verifyCodeHash(String code, String hash) {
        String computedHash = hashCode(code);
        return computedHash.equals(hash);
    }

    private boolean sendCodeViaNotificationService(String phoneNumber, String code, String businessType, Long tenantId, String businessId, String metadata) {
        try {
            log.info("Sending verification code via unified notification - phoneNumber: {}, businessType: {}, tenantId: {}",
                    phoneNumber, businessType, tenantId);

            // 根据 businessType 确定通知场景
            NotificationScene scene = mapBusinessTypeToScene(businessType);
            if (scene == null) {
                log.error("Unsupported business type for unified notification: {}", businessType);
                // 降级到旧方式
                String businessTypeDesc = getBusinessTypeDescription(businessType);
                String message = String.format("【商户平台】您的%s验证码是：%s，%d分钟内有效。",
                        businessTypeDesc, code, expiryMinutes);
                return notificationMQService.sendSms(phoneNumber, message, tenantId, businessType, businessId, "VERIFICATION");
            }

            // 构建通知变量
            Map<String, Object> variables = new HashMap<>();
            variables.put("code", code);
            variables.put("phoneNumber", phoneNumber);
            variables.put("expiryMinutes", expiryMinutes);
            variables.put("businessType", businessType);

            // 如果是套餐支付验证，从metadata中解析商户名和套餐名
            if (("PACKAGE_VERIFICATION".equals(businessType) || "PACKAGE_PAYMENT".equals(businessType)) && metadata != null) {
                try {
                    Map<String, Object> metadataMap = objectMapper.readValue(metadata, Map.class);
                    if (metadataMap.containsKey("merchantName")) {
                        variables.put("merchantName", metadataMap.get("merchantName"));
                    }
                    if (metadataMap.containsKey("packageName")) {
                        variables.put("packageName", metadataMap.get("packageName"));
                    }
                    log.info("Parsed metadata for package verification - merchantName: {}, packageName: {}",
                            metadataMap.get("merchantName"), metadataMap.get("packageName"));
                } catch (Exception e) {
                    log.warn("Failed to parse metadata for package verification: {}", e.getMessage());
                }
            }

            // 构建 NotificationRequest
            NotificationRequest request = NotificationRequest.builder()
                    .scene(scene.getCode())
                    .tenantId(tenantId)
                    .recipient(NotificationRequest.RecipientInfo.builder()
                            .phone(phoneNumber)
                            .build())
                    .channel("SMS")
                    .variables(variables)
                    .businessId(businessId)
                    .build();

            // 构建 NotificationMessage payload
            Map<String, Object> payload = new HashMap<>();
            payload.put("scene", request.getScene());
            payload.put("tenantId", request.getTenantId());
            payload.put("recipient", request.getRecipient());
            payload.put("channel", request.getChannel());
            payload.put("variables", request.getVariables());
            payload.put("businessId", request.getBusinessId());

            // 创建通知消息
            NotificationMessage message = NotificationMessage.builder()
                    .messageType(NotificationMessage.MessageType.SMS)
                    .priority(NotificationMessage.Priority.URGENT)
                    .tenantId(tenantId)
                    .payload(payload)
                    .build();

            // 根据场景发送到对应的队列
            sendToAppropriateQueue(scene, message);

            log.info("Verification code sent via unified notification successfully - scene: {}, businessType: {}",
                    scene, businessType);
            return true;
        } catch (Exception e) {
            log.error("Failed to send SMS via unified notification, error: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * 将 businessType 映射到 NotificationScene
     */
    private NotificationScene mapBusinessTypeToScene(String businessType) {
        return switch (businessType) {
            case "LOGIN_2FA" -> NotificationScene.USER_LOGIN_2FA;
            case "PACKAGE_VERIFICATION", "PACKAGE_PAYMENT" -> NotificationScene.PACKAGE_CONSUMPTION_VERIFY;
            default -> null; // 不支持的类型返回 null
        };
    }

    /**
     * 根据场景发送到对应的队列
     */
    private void sendToAppropriateQueue(NotificationScene scene, NotificationMessage message) {
        switch (scene) {
            case USER_LOGIN_2FA -> notificationMessageProducer.sendUserLogin2FA(message);
            case PACKAGE_CONSUMPTION_VERIFY -> notificationMessageProducer.sendPackageConsumptionVerify(message);
            default -> throw new IllegalArgumentException("Unsupported notification scene: " + scene);
        }
    }

    private String getBusinessTypeDescription(String businessType) {
        try {
            VerificationCode.BusinessType type = VerificationCode.BusinessType.valueOf(businessType);
            return type.getDescription();
        } catch (Exception e) {
            return "操作";
        }
    }
}
