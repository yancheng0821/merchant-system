package com.merchant.server.notificationservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 设备推送Token实体
 * 用于存储用户的移动设备推送通知Token (FCM/APNs)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceToken {

    private Long id;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 租户ID
     */
    private Long tenantId;

    /**
     * 设备推送Token (FCM/APNs)
     */
    private String token;

    /**
     * 平台类型: ios, android
     */
    private String platform;

    /**
     * 设备信息 (JSON格式)
     */
    private String deviceInfo;

    /**
     * 是否有效
     */
    private Boolean isActive;

    /**
     * 最后使用时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastUsedAt;

    /**
     * 创建时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
