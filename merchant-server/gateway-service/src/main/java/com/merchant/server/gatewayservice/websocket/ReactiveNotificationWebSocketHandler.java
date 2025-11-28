package com.merchant.server.gatewayservice.websocket;

import com.merchant.server.gatewayservice.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * 响应式 WebSocket 处理器
 * 处理客户端连接、断开和消息
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReactiveNotificationWebSocketHandler implements WebSocketHandler {

    private final ReactiveWebSocketSessionManager sessionManager;
    private final JwtUtil jwtUtil;

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        // 从 URL 参数中提取 tenantId
        Long tenantId = extractTenantIdFromSession(session);

        if (tenantId == null) {
            log.warn("[WebSocket] Connection rejected - no valid tenantId, sessionId: {}", session.getId());
            return session.close();
        }

        // 创建消息发送器
        Sinks.Many<String> sink = Sinks.many().multicast().onBackpressureBuffer();

        // 注册会话
        sessionManager.registerSession(tenantId, session.getId(), sink);
        log.info("[WebSocket] Session registered - tenantId: {}, sessionId: {}", tenantId, session.getId());

        // 发送连接成功消息
        sink.tryEmitNext("{\"type\":\"CONNECTED\",\"message\":\"WebSocket connection established\"}");

        // 处理接收到的消息
        Mono<Void> input = session.receive()
                .doOnNext(message -> handleMessage(session, message))
                .doOnError(error -> log.error("[WebSocket] Error receiving message - sessionId: {}", session.getId(), error))
                .doOnTerminate(() -> {
                    sessionManager.removeSession(session.getId());
                    log.info("[WebSocket] Session terminated - tenantId: {}, sessionId: {}", tenantId, session.getId());
                })
                .then();

        // 发送消息到客户端
        Mono<Void> output = session.send(
                sink.asFlux()
                        .map(session::textMessage)
        );

        // 心跳保持连接
        Flux<WebSocketMessage> pingFlux = Flux.interval(Duration.ofSeconds(30))
                .map(tick -> session.pingMessage(factory -> factory.wrap(new byte[0])));

        return Mono.zip(input, output, session.send(pingFlux)).then()
                .doOnTerminate(() -> {
                    sessionManager.removeSession(session.getId());
                });
    }

    private void handleMessage(WebSocketSession session, WebSocketMessage message) {
        String payload = message.getPayloadAsText();

        // 处理心跳
        if ("ping".equalsIgnoreCase(payload) || "{\"type\":\"ping\"}".equals(payload)) {
            Sinks.Many<String> sink = sessionManager.getSink(session.getId());
            if (sink != null) {
                sink.tryEmitNext("{\"type\":\"pong\"}");
            }
            return;
        }

        log.debug("[WebSocket] Received message - sessionId: {}, payload: {}", session.getId(), payload);
    }

    /**
     * 从 WebSocket 会话中提取 tenantId
     * URL 格式: ws://host/ws/notifications?token=xxx
     */
    private Long extractTenantIdFromSession(WebSocketSession session) {
        try {
            URI uri = session.getHandshakeInfo().getUri();
            String query = uri.getQuery();

            if (query == null) {
                log.warn("[WebSocket] No query parameters in URL");
                return null;
            }

            // 解析 token 参数
            String token = null;
            for (String param : query.split("&")) {
                String[] keyValue = param.split("=", 2);
                if (keyValue.length == 2 && "token".equals(keyValue[0])) {
                    // URL 解码 token
                    token = URLDecoder.decode(keyValue[1], StandardCharsets.UTF_8);
                    break;
                }
            }

            if (token == null || token.isEmpty()) {
                log.warn("[WebSocket] No token provided in URL");
                return null;
            }

            log.info("[WebSocket] Token received (first 50 chars): {}...", token.substring(0, Math.min(50, token.length())));
            log.info("[WebSocket] Token length: {}", token.length());

            // 验证 token 并提取 tenantId
            boolean isValid = jwtUtil.validateToken(token);
            log.info("[WebSocket] Token validation result: {}", isValid);
            if (!isValid) {
                log.warn("[WebSocket] Invalid token - validation failed");
                return null;
            }

            Long tenantId = jwtUtil.extractTenantId(token);
            String username = jwtUtil.extractUsername(token);
            log.info("[WebSocket] Extracted from token - tenantId: {}, username: {}", tenantId, username);
            return tenantId;

        } catch (Exception e) {
            log.error("[WebSocket] Failed to extract tenantId", e);
            return null;
        }
    }
}
