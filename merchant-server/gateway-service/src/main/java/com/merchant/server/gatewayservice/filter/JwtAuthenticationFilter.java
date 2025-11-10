package com.merchant.server.gatewayservice.filter;

import com.merchant.server.gatewayservice.util.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.List;

/**
 * JWT认证全局过滤器
 * 在Gateway层统一处理JWT认证，提取用户信息传递给下游服务
 */
@Slf4j
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * 白名单：不需要认证的路径
     */
    private static final List<String> PUBLIC_PATHS = Arrays.asList(
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/merchant-register",
        "/api/auth/refresh",
        "/api/auth/health",
        "/api/auth/validate-invitation",
        "/api/auth/invitations/validate",
        "/api/auth/send-2fa-code",
        "/api/auth/verify-2fa-code",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
        "/api/auth/validate-reset-token",
        "/api/test/",
        "/actuator/",
        "/static/uploads/"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();

        log.debug("Processing request: {}", path);

        // 检查是否是公开路径
        if (isPublicPath(path)) {
            log.debug("Public path, skipping authentication: {}", path);
            return chain.filter(exchange);
        }

        // 提取JWT token
        String token = extractToken(request);
        if (token == null) {
            log.warn("No JWT token found in request to: {}", path);
            return unauthorizedResponse(exchange, "Authentication token not found");
        }

        // 验证token
        if (!jwtUtil.validateToken(token)) {
            log.warn("Invalid JWT token for request to: {}", path);
            return unauthorizedResponse(exchange, "Invalid or expired token");
        }

        // 提取用户信息
        Long userId = jwtUtil.extractUserId(token);
        Long tenantId = jwtUtil.extractTenantId(token);
        String username = jwtUtil.extractUsername(token);

        if (userId == null) {
            log.warn("Failed to extract user ID from token");
            return unauthorizedResponse(exchange, "Invalid token payload");
        }

        log.debug("Authenticated user: id={}, username={}, tenantId={}", userId, username, tenantId);

        // 将用户信息添加到请求Header中，传递给下游服务
        ServerHttpRequest modifiedRequest = request.mutate()
            .header("X-User-Id", String.valueOf(userId))
            .header("X-Tenant-Id", tenantId != null ? String.valueOf(tenantId) : "")
            .header("X-Username", username != null ? username : "")
            .header("X-Authenticated", "true")
            .build();

        // 继续请求链
        return chain.filter(exchange.mutate().request(modifiedRequest).build());
    }

    /**
     * 检查是否是公开路径
     */
    private boolean isPublicPath(String path) {
        return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }

    /**
     * 从请求中提取JWT token
     */
    private String extractToken(ServerHttpRequest request) {
        String authHeader = request.getHeaders().getFirst("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }

    /**
     * 返回401未授权响应
     */
    private Mono<Void> unauthorizedResponse(ServerWebExchange exchange, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().add("Content-Type", "application/json");

        String body = String.format("{\"success\":false,\"message\":\"%s\",\"error\":\"UNAUTHORIZED\"}", message);
        return response.writeWith(Mono.just(response.bufferFactory().wrap(body.getBytes())));
    }

    /**
     * 设置过滤器优先级（越小越先执行）
     */
    @Override
    public int getOrder() {
        return -100; // 在其他过滤器之前执行
    }
}
