package com.merchant.server.gatewayservice.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT工具类 - Gateway版本
 * 用于验证JWT token并提取用户信息
 */
@Slf4j
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 验证token是否有效
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            log.debug("JWT token validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 从token中提取Claims
     */
    private Claims extractClaims(String token) {
        try {
            return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        } catch (Exception e) {
            log.error("Failed to extract claims from token: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 提取用户ID
     */
    public Long extractUserId(String token) {
        Claims claims = extractClaims(token);
        if (claims == null) return null;

        Object userId = claims.get("userId");
        if (userId instanceof Integer) {
            return ((Integer) userId).longValue();
        } else if (userId instanceof Long) {
            return (Long) userId;
        }
        return null;
    }

    /**
     * 提取租户ID
     */
    public Long extractTenantId(String token) {
        Claims claims = extractClaims(token);
        if (claims == null) return null;

        Object tenantId = claims.get("tenantId");
        if (tenantId instanceof Integer) {
            return ((Integer) tenantId).longValue();
        } else if (tenantId instanceof Long) {
            return (Long) tenantId;
        }
        return null;
    }

    /**
     * 提取用户名
     */
    public String extractUsername(String token) {
        Claims claims = extractClaims(token);
        return claims != null ? claims.getSubject() : null;
    }

    /**
     * 检查token是否过期
     */
    public boolean isTokenExpired(String token) {
        Claims claims = extractClaims(token);
        if (claims == null) return true;

        Date expiration = claims.getExpiration();
        return expiration.before(new Date());
    }

    /**
     * 提取订阅过期标识
     */
    public boolean extractSubscriptionExpired(String token) {
        Claims claims = extractClaims(token);
        if (claims == null) return false;

        Object subscriptionExpired = claims.get("subscriptionExpired");
        if (subscriptionExpired instanceof Boolean) {
            return (Boolean) subscriptionExpired;
        }
        return false;
    }
}
