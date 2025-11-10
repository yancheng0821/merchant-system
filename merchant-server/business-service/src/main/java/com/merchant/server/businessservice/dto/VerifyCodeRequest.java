package com.merchant.server.businessservice.dto;

import lombok.Data;

/**
 * 验证验证码请求DTO
 */
@Data
public class VerifyCodeRequest {

    /**
     * 验证码ID
     */
    private Long verificationId;

    /**
     * 验证码
     */
    private String code;

    /**
     * IP地址（用于安全验证）
     */
    private String ipAddress;
}
