package com.merchant.server.gatewayservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * WebSocket 通知 DTO
 * 用于接收来自其他服务的通知请求
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketNotificationDTO {

    /**
     * 目标租户ID
     */
    private Long tenantId;

    /**
     * 通知类型: NEW_APPOINTMENT, APPOINTMENT_UPDATED, APPOINTMENT_CANCELLED
     */
    private String type;

    /**
     * 通知数据 (JSON 字符串)
     */
    private String data;
}
