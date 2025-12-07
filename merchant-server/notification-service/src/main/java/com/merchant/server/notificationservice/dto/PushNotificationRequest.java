package com.merchant.server.notificationservice.dto;

import lombok.Data;

import java.util.Map;

/**
 * 推送通知请求DTO
 */
@Data
public class PushNotificationRequest {

    /**
     * 设备推送Token（发送给单个设备时使用）
     */
    private String token;

    /**
     * 通知标题
     */
    private String title;

    /**
     * 通知内容
     */
    private String body;

    /**
     * 附加数据（可选）
     */
    private Map<String, String> data;
}
