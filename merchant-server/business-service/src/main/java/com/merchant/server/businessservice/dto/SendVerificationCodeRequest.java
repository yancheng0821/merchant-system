package com.merchant.server.businessservice.dto;

import lombok.Data;

/**
 * 发送验证码请求DTO
 */
@Data
public class SendVerificationCodeRequest {

    /**
     * 租户ID
     */
    private Long tenantId;

    /**
     * 业务类型：PACKAGE_PAYMENT, USER_REGISTER, PASSWORD_RESET等
     */
    private String businessType;

    /**
     * 业务关联ID（可选）
     */
    private String businessId;

    /**
     * 接收者类型：PHONE, EMAIL
     */
    private String recipientType;

    /**
     * 接收者（手机号或邮箱）
     */
    private String recipient;

    /**
     * IP地址（用于安全验证）
     */
    private String ipAddress;

    /**
     * 用户代理
     */
    private String userAgent;

    /**
     * 额外元数据（JSON格式）
     */
    private String metadata;
}
