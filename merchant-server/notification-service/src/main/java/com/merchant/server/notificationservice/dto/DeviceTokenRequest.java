package com.merchant.server.notificationservice.dto;

import lombok.Data;

/**
 * 设备Token请求DTO
 */
@Data
public class DeviceTokenRequest {

    /**
     * 设备推送Token
     */
    private String token;

    /**
     * 平台类型: ios, android
     */
    private String platform;

    /**
     * 设备信息 (可选)
     */
    private Object deviceInfo;
}
