package com.merchant.server.gatewayservice.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Sinks;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * 响应式 WebSocket 会话管理器
 * 按 tenantId 管理 WebSocket 连接
 */
@Slf4j
@Component
public class ReactiveWebSocketSessionManager {

    // tenantId -> Set<sessionId>
    private final Map<Long, Set<String>> tenantSessions = new ConcurrentHashMap<>();

    // sessionId -> tenantId (用于快速查找)
    private final Map<String, Long> sessionTenantMap = new ConcurrentHashMap<>();

    // sessionId -> Sink (用于发送消息)
    private final Map<String, Sinks.Many<String>> sessionSinks = new ConcurrentHashMap<>();

    /**
     * 注册会话
     */
    public void registerSession(Long tenantId, String sessionId, Sinks.Many<String> sink) {
        tenantSessions.computeIfAbsent(tenantId, k -> new CopyOnWriteArraySet<>()).add(sessionId);
        sessionTenantMap.put(sessionId, tenantId);
        sessionSinks.put(sessionId, sink);

        log.info("[WebSocket] Session registered - tenantId: {}, sessionId: {}, total sessions for tenant: {}",
                tenantId, sessionId, tenantSessions.get(tenantId).size());
    }

    /**
     * 移除会话
     */
    public void removeSession(String sessionId) {
        Long tenantId = sessionTenantMap.remove(sessionId);
        sessionSinks.remove(sessionId);

        if (tenantId != null) {
            Set<String> sessions = tenantSessions.get(tenantId);
            if (sessions != null) {
                sessions.remove(sessionId);
                if (sessions.isEmpty()) {
                    tenantSessions.remove(tenantId);
                }
            }
            log.info("[WebSocket] Session removed - tenantId: {}, sessionId: {}", tenantId, sessionId);
        }
    }

    /**
     * 获取会话的 Sink
     */
    public Sinks.Many<String> getSink(String sessionId) {
        return sessionSinks.get(sessionId);
    }

    /**
     * 向指定租户的所有会话发送消息
     */
    public void sendToTenant(Long tenantId, String message) {
        Set<String> sessions = tenantSessions.get(tenantId);
        if (sessions == null || sessions.isEmpty()) {
            log.debug("[WebSocket] No active sessions for tenantId: {}", tenantId);
            return;
        }

        log.info("[WebSocket] Sending message to tenantId: {}, session count: {}", tenantId, sessions.size());

        for (String sessionId : sessions) {
            Sinks.Many<String> sink = sessionSinks.get(sessionId);
            if (sink != null) {
                Sinks.EmitResult result = sink.tryEmitNext(message);
                if (result.isFailure()) {
                    log.warn("[WebSocket] Failed to send message to session: {}, result: {}", sessionId, result);
                    removeSession(sessionId);
                }
            }
        }
    }

    /**
     * 获取指定租户的活跃会话数
     */
    public int getSessionCount(Long tenantId) {
        Set<String> sessions = tenantSessions.get(tenantId);
        return sessions != null ? sessions.size() : 0;
    }

    /**
     * 获取总活跃会话数
     */
    public int getTotalSessionCount() {
        return sessionTenantMap.size();
    }
}
