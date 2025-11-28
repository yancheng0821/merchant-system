package com.merchant.server.businessservice.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * 预约取消 Token 工具类
 * 生成安全的、不可伪造的取消链接 token
 */
@Slf4j
@Component
public class CancelTokenUtil {

    @Value("${cancel.token.secret:MerchantCancelTokenSecret2024!}")
    private String secret;

    @Value("${cancel.token.expiry-days:7}")
    private int expiryDays;

    private static final String ALGORITHM = "HmacSHA256";
    private static final String SEPARATOR = ".";

    /**
     * 生成取消 token
     * 格式: base64(appointmentId.customerId.expiry).signature
     *
     * @param appointmentId 预约ID
     * @param customerId    客户ID
     * @return 安全的取消 token
     */
    public String generateToken(Long appointmentId, Long customerId) {
        try {
            // 过期时间：当前时间 + expiryDays 天
            long expiryTime = System.currentTimeMillis() + (expiryDays * 24L * 60 * 60 * 1000);

            // 数据部分
            String data = appointmentId + SEPARATOR + customerId + SEPARATOR + expiryTime;
            String encodedData = Base64.getUrlEncoder().withoutPadding().encodeToString(data.getBytes(StandardCharsets.UTF_8));

            // 签名
            String signature = sign(encodedData);

            return encodedData + SEPARATOR + signature;
        } catch (Exception e) {
            log.error("Failed to generate cancel token for appointment: {}", appointmentId, e);
            throw new RuntimeException("Failed to generate cancel token", e);
        }
    }

    /**
     * 验证并解析 token
     *
     * @param token 取消 token
     * @return 解析结果，包含 appointmentId 和 customerId；验证失败返回 null
     */
    public TokenData verifyAndParse(String token) {
        try {
            if (token == null || token.isEmpty()) {
                log.warn("Cancel token is empty");
                return null;
            }

            // 分离数据和签名
            int lastDotIndex = token.lastIndexOf(SEPARATOR);
            if (lastDotIndex == -1) {
                log.warn("Invalid token format: no signature separator");
                return null;
            }

            String encodedData = token.substring(0, lastDotIndex);
            String signature = token.substring(lastDotIndex + 1);

            // 验证签名
            String expectedSignature = sign(encodedData);
            if (!signature.equals(expectedSignature)) {
                log.warn("Invalid token signature");
                return null;
            }

            // 解码数据
            String data = new String(Base64.getUrlDecoder().decode(encodedData), StandardCharsets.UTF_8);
            String[] parts = data.split("\\" + SEPARATOR);
            if (parts.length != 3) {
                log.warn("Invalid token data format");
                return null;
            }

            Long appointmentId = Long.parseLong(parts[0]);
            Long customerId = Long.parseLong(parts[1]);
            long expiryTime = Long.parseLong(parts[2]);

            // 检查是否过期
            if (System.currentTimeMillis() > expiryTime) {
                log.warn("Cancel token expired for appointment: {}", appointmentId);
                return null;
            }

            return new TokenData(appointmentId, customerId);

        } catch (Exception e) {
            log.error("Failed to verify cancel token", e);
            return null;
        }
    }

    /**
     * HMAC-SHA256 签名
     */
    private String sign(String data) throws Exception {
        Mac mac = Mac.getInstance(ALGORITHM);
        SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), ALGORITHM);
        mac.init(keySpec);
        byte[] signatureBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(signatureBytes);
    }

    /**
     * Token 解析结果
     */
    public static class TokenData {
        private final Long appointmentId;
        private final Long customerId;

        public TokenData(Long appointmentId, Long customerId) {
            this.appointmentId = appointmentId;
            this.customerId = customerId;
        }

        public Long getAppointmentId() {
            return appointmentId;
        }

        public Long getCustomerId() {
            return customerId;
        }
    }
}
