package com.merchant.server.businessservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 验证码响应DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerificationCodeResponse {

    /**
     * 验证码ID
     */
    private Long verificationId;

    /**
     * 是否成功
     */
    private Boolean success;

    /**
     * 消息
     */
    private String message;

    /**
     * 过期时间（分钟）
     */
    private Integer expiresInMinutes;

    /**
     * 剩余重试次数
     */
    private Integer remainingAttempts;

    public static VerificationCodeResponse success(Long verificationId, String message, Integer expiresInMinutes) {
        return new VerificationCodeResponse(verificationId, true, message, expiresInMinutes, null);
    }

    public static VerificationCodeResponse failure(String message) {
        return new VerificationCodeResponse(null, false, message, null, null);
    }

    public static VerificationCodeResponse verificationSuccess(String message) {
        return new VerificationCodeResponse(null, true, message, null, null);
    }

    public static VerificationCodeResponse verificationFailure(String message, Integer remainingAttempts) {
        VerificationCodeResponse response = new VerificationCodeResponse(null, false, message, null, remainingAttempts);
        return response;
    }
}
