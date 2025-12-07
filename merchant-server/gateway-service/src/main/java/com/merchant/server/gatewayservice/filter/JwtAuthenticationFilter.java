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
        "/api/merchant/webhooks/",  // Stripe webhook - 不需要JWT认证
        "/api/merchant/stripe/subscription/admin/",  // TODO: 测试完成后移除此行
        "/api/test/",
        "/actuator/",
        "/static/uploads/",
        "/api/public/",  // 公开预约API - 不需要JWT认证
        "/api/merchant/subscription-plan"  // 套餐列表（公开Pricing页面需要）
    );

    /**
     * 订阅过期时允许访问的路径（只能访问订阅/支付相关API）
     */
    private static final List<String> SUBSCRIPTION_EXPIRED_ALLOWED_PATHS = Arrays.asList(
        "/api/auth/logout",
        "/api/auth/validate-token",
        "/api/auth/validate",  // Token验证（AuthContext初始化需要）
        "/api/auth/user/",  // 用户信息
        "/api/merchant/subscription",  // 订阅相关（支持 /subscription 和 /subscription/xxx）
        "/api/merchant/stripe/",  // Stripe支付相关
        "/api/merchant/plans",  // 订阅计划
        "/api/merchant/subscription-plan",  // 套餐列表（Pricing页面需要）
        "/api/merchant/merchants/",  // 商户基本信息
        "/api/merchant/notifications/",  // 系统通知（顶部通知栏）
        "/api/merchant/config/",  // 商户配置（用于显示商户名等）
        "/api/business/notifications/"  // 业务通知API
    );

    /**
     * 需要来源验证的路径（防止滥用）
     */
    private static final List<String> ORIGIN_RESTRICTED_PATHS = Arrays.asList(
        "/api/public/places/"  // Google Places API - 需要验证来源
    );

    /**
     * 允许的请求来源
     */
    private static final List<String> ALLOWED_ORIGINS = Arrays.asList(
        "https://vamerchant.app",
        "https://www.vamerchant.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();

        log.debug("Processing request: {}", path);

        // 检查是否需要来源验证
        if (isOriginRestrictedPath(path)) {
            if (!isValidOrigin(request)) {
                log.warn("Rejected request from unauthorized origin: path={}", path);
                return forbiddenResponse(exchange, "Access denied: invalid origin");
            }
        }

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
        boolean subscriptionExpired = jwtUtil.extractSubscriptionExpired(token);

        if (userId == null) {
            log.warn("Failed to extract user ID from token");
            return unauthorizedResponse(exchange, "Invalid token payload");
        }

        log.debug("Authenticated user: id={}, username={}, tenantId={}, subscriptionExpired={}", userId, username, tenantId, subscriptionExpired);

        // 检查订阅过期限制
        if (subscriptionExpired && !isSubscriptionExpiredAllowedPath(path)) {
            log.warn("Subscription expired user trying to access restricted path: userId={}, path={}", userId, path);
            return forbiddenResponse(exchange, "Subscription expired. Please renew your subscription to access this feature.");
        }

        // 将用户信息添加到请求Header中，传递给下游服务
        ServerHttpRequest modifiedRequest = request.mutate()
            .header("X-User-Id", String.valueOf(userId))
            .header("X-Tenant-Id", tenantId != null ? String.valueOf(tenantId) : "")
            .header("X-Username", username != null ? username : "")
            .header("X-Authenticated", "true")
            .header("X-Subscription-Expired", String.valueOf(subscriptionExpired))
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
     * 检查是否是订阅过期时允许访问的路径
     */
    private boolean isSubscriptionExpiredAllowedPath(String path) {
        return SUBSCRIPTION_EXPIRED_ALLOWED_PATHS.stream().anyMatch(path::startsWith);
    }

    /**
     * 检查是否是需要来源验证的路径
     */
    private boolean isOriginRestrictedPath(String path) {
        return ORIGIN_RESTRICTED_PATHS.stream().anyMatch(path::startsWith);
    }

    /**
     * 验证请求来源是否合法
     */
    private boolean isValidOrigin(ServerHttpRequest request) {
        String origin = request.getHeaders().getFirst("Origin");
        String referer = request.getHeaders().getFirst("Referer");

        // 检查 Origin header
        if (origin != null) {
            for (String allowed : ALLOWED_ORIGINS) {
                if (origin.equals(allowed) || origin.startsWith(allowed)) {
                    return true;
                }
            }
        }

        // 如果没有 Origin，检查 Referer header
        if (referer != null) {
            for (String allowed : ALLOWED_ORIGINS) {
                if (referer.startsWith(allowed)) {
                    return true;
                }
            }
        }

        log.debug("Origin validation failed: origin={}, referer={}", origin, referer);
        return false;
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
     * 返回403禁止访问响应
     */
    private Mono<Void> forbiddenResponse(ServerWebExchange exchange, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.FORBIDDEN);
        response.getHeaders().add("Content-Type", "application/json");

        String body = String.format("{\"success\":false,\"message\":\"%s\",\"error\":\"FORBIDDEN\"}", message);
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
