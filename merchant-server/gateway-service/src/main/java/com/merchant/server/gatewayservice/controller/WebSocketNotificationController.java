package com.merchant.server.gatewayservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.server.gatewayservice.dto.WebSocketNotificationDTO;
import com.merchant.server.gatewayservice.websocket.ReactiveWebSocketSessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * WebSocket 通知控制器
 * 提供内部 API 供其他服务调用来推送 WebSocket 通知
 */
@Slf4j
@RestController
@RequestMapping("/internal/ws")
@RequiredArgsConstructor
public class WebSocketNotificationController {

    private final ReactiveWebSocketSessionManager sessionManager;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 发送通知到指定租户的所有连接
     */
    @PostMapping("/notify")
    public ResponseEntity<Map<String, Object>> sendNotification(@RequestBody WebSocketNotificationDTO notification) {
        Map<String, Object> response = new HashMap<>();

        try {
            Long tenantId = notification.getTenantId();
            if (tenantId == null) {
                response.put("success", false);
                response.put("error", "tenantId is required");
                return ResponseEntity.badRequest().body(response);
            }

            // 构建 WebSocket 消息
            Map<String, Object> wsMessage = new HashMap<>();
            wsMessage.put("type", notification.getType());
            wsMessage.put("data", notification.getData());
            wsMessage.put("timestamp", System.currentTimeMillis());

            String messageJson = objectMapper.writeValueAsString(wsMessage);

            // 发送到租户的所有连接
            sessionManager.sendToTenant(tenantId, messageJson);

            int sessionCount = sessionManager.getSessionCount(tenantId);
            log.info("[WebSocket] Notification sent - tenantId: {}, type: {}, sessions: {}",
                    tenantId, notification.getType(), sessionCount);

            response.put("success", true);
            response.put("sessionCount", sessionCount);
            response.put("message", "Notification sent to " + sessionCount + " session(s)");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("[WebSocket] Failed to send notification", e);
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 获取指定租户的活跃连接数
     */
    @GetMapping("/sessions/{tenantId}")
    public ResponseEntity<Map<String, Object>> getSessionCount(@PathVariable Long tenantId) {
        Map<String, Object> response = new HashMap<>();
        response.put("tenantId", tenantId);
        response.put("sessionCount", sessionManager.getSessionCount(tenantId));
        response.put("totalSessions", sessionManager.getTotalSessionCount());
        return ResponseEntity.ok(response);
    }

    /**
     * 健康检查
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("totalSessions", sessionManager.getTotalSessionCount());
        return ResponseEntity.ok(response);
    }
}
