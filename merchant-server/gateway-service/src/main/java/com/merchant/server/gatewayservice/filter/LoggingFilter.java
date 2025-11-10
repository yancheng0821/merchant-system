package com.merchant.server.gatewayservice.filter;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Gateway全局日志过滤器
 * 功能：
 * 1. 生成traceId用于追踪请求全链路
 * 2. 记录请求信息（方法、路径、参数、头部）
 * 3. 记录响应信息（状态码、耗时）
 */
@Slf4j
@Component
public class LoggingFilter implements GlobalFilter, Ordered {

    private static final String TRACE_ID = "X-Trace-Id";
    private static final String START_TIME = "startTime";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        // 生成或获取traceId
        String tempTraceId = request.getHeaders().getFirst(TRACE_ID);
        if (tempTraceId == null || tempTraceId.isEmpty()) {
            tempTraceId = UUID.randomUUID().toString().replace("-", "");
        }
        final String traceId = tempTraceId;

        // 添加traceId到请求头，传递给下游服务
        ServerHttpRequest mutatedRequest = request.mutate()
                .header(TRACE_ID, traceId)
                .build();

        ServerWebExchange mutatedExchange = exchange.mutate()
                .request(mutatedRequest)
                .build();

        // 记录请求开始时间
        final long startTime = System.currentTimeMillis();
        mutatedExchange.getAttributes().put(START_TIME, startTime);

        // 记录请求信息
        logRequest(mutatedRequest, traceId);

        // 继续过滤器链，并在响应后记录响应信息
        return chain.filter(mutatedExchange)
                .doFinally(signalType -> {
                    ServerHttpResponse response = mutatedExchange.getResponse();
                    Long startTimeAttr = mutatedExchange.getAttribute(START_TIME);
                    long duration = startTimeAttr != null ? System.currentTimeMillis() - startTimeAttr : 0;
                    logResponse(response, traceId, duration);
                });
    }

    /**
     * 记录请求信息
     */
    private void logRequest(ServerHttpRequest request, String traceId) {
        String method = request.getMethod().name();
        String path = request.getURI().getPath();
        String query = request.getURI().getQuery();
        String clientIp = getClientIp(request);

        // 简洁的单行日志格式
        String fullPath = query != null && !query.isEmpty() ? path + "?" + query : path;
        log.info("Request: {} {} [TraceId: {}, IP: {}]", method, fullPath, traceId, clientIp);
    }

    /**
     * 记录响应信息
     */
    private void logResponse(ServerHttpResponse response, String traceId, long duration) {
        int status = response.getStatusCode() != null ? response.getStatusCode().value() : 0;
        // 简洁的单行日志格式
        log.info("Response: Status={}, Duration={}ms [TraceId: {}]", status, duration, traceId);
    }

    /**
     * 获取客户端真实IP
     */
    private String getClientIp(ServerHttpRequest request) {
        String ip = request.getHeaders().getFirst("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeaders().getFirst("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddress() != null ?
                  request.getRemoteAddress().getAddress().getHostAddress() : "unknown";
        }
        // 如果有多个IP（经过多个代理），取第一个
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
