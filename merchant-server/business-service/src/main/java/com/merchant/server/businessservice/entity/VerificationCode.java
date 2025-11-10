package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * 通用验证码实体
 */
@Data
public class VerificationCode {

    private Long id;
    private Long tenantId;
    private BusinessType businessType;
    private String businessId;
    private RecipientType recipientType;
    private String recipient;
    private String verificationCode;
    private String codeHash;
    private VerificationStatus status;
    private Integer attempts;
    private Integer maxAttempts;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime expiresAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime verifiedAt;

    private String ipAddress;
    private String userAgent;
    private String metadata;

    /**
     * 业务类型枚举
     */
    public enum BusinessType {
        PACKAGE_PAYMENT("套餐支付"),
        USER_REGISTER("用户注册"),
        PASSWORD_RESET("密码重置"),
        PHONE_VERIFICATION("手机验证"),
        SENSITIVE_OPERATION("敏感操作"),
        APPOINTMENT_CONFIRM("预约确认"),
        LOGIN_2FA("登录二次验证");

        private final String description;

        BusinessType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 接收者类型枚举
     */
    public enum RecipientType {
        PHONE("手机"),
        EMAIL("邮箱");

        private final String description;

        RecipientType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 验证状态枚举
     */
    public enum VerificationStatus {
        PENDING("待验证"),
        VERIFIED("已验证"),
        EXPIRED("已过期"),
        FAILED("验证失败");

        private final String description;

        VerificationStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 检查验证码是否已过期
     */
    public boolean isExpired() {
        return LocalDateTime.now(ZoneOffset.UTC).isAfter(expiresAt);
    }

    /**
     * 检查是否达到最大尝试次数
     */
    public boolean isMaxAttemptsReached() {
        return attempts >= maxAttempts;
    }

    /**
     * 检查是否可以验证
     */
    public boolean canVerify() {
        return status == VerificationStatus.PENDING
            && !isExpired()
            && !isMaxAttemptsReached();
    }
}
