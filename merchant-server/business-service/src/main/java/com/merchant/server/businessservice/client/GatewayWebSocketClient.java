package com.merchant.server.businessservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

/**
 * Gateway WebSocket Feign Client
 * 用于调用 Gateway 的内部 WebSocket 通知端点
 */
@FeignClient(name = "gateway-service", path = "/internal/ws")
public interface GatewayWebSocketClient {

    /**
     * 发送 WebSocket 通知
     */
    @PostMapping("/notify")
    Map<String, Object> sendNotification(@RequestBody WebSocketNotificationRequest request);

    /**
     * WebSocket 通知请求
     */
    class WebSocketNotificationRequest {
        private Long tenantId;
        private String type;
        private String data;

        public WebSocketNotificationRequest() {}

        public WebSocketNotificationRequest(Long tenantId, String type, String data) {
            this.tenantId = tenantId;
            this.type = type;
            this.data = data;
        }

        public Long getTenantId() {
            return tenantId;
        }

        public void setTenantId(Long tenantId) {
            this.tenantId = tenantId;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getData() {
            return data;
        }

        public void setData(String data) {
            this.data = data;
        }
    }
}
