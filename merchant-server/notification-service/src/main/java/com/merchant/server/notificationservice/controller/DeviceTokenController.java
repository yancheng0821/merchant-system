package com.merchant.server.notificationservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.server.common.dto.ApiResponse;
import com.merchant.server.notificationservice.dto.DeviceTokenRequest;
import com.merchant.server.notificationservice.entity.DeviceToken;
import com.merchant.server.notificationservice.mapper.DeviceTokenMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * 设备Token Controller
 * 处理移动设备推送Token的注册和管理
 */
@Slf4j
@RestController
@RequestMapping("/api/notification/device-token")
@RequiredArgsConstructor
public class DeviceTokenController {

    private final DeviceTokenMapper deviceTokenMapper;
    private final ObjectMapper objectMapper;

    /**
     * 注册/更新设备Token
     */
    @PostMapping
    public ApiResponse<Void> registerToken(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-Tenant-Id") Long tenantId,
            @RequestBody DeviceTokenRequest request) {

        String tokenPrefix = request.getToken() != null && request.getToken().length() > 30
                ? request.getToken().substring(0, 30) + "..."
                : request.getToken();
        log.info("注册设备Token - userId: {}, tenantId: {}, platform: {}, token: {}",
                userId, tenantId, request.getPlatform(), tokenPrefix);

        try {
            // 检查token是否已存在
            DeviceToken existing = deviceTokenMapper.findByToken(request.getToken());
            log.info("查询已有token结果: {}", existing != null ? "找到 ID=" + existing.getId() : "未找到");

            if (existing != null) {
                // 更新现有记录
                existing.setUserId(userId);
                existing.setTenantId(tenantId);
                existing.setPlatform(request.getPlatform());
                existing.setIsActive(true);
                existing.setLastUsedAt(LocalDateTime.now(ZoneOffset.UTC));
                if (request.getDeviceInfo() != null) {
                    existing.setDeviceInfo(objectMapper.writeValueAsString(request.getDeviceInfo()));
                }
                deviceTokenMapper.updateById(existing);
                log.info("更新设备Token成功 - id: {}", existing.getId());

                // 将该用户同平台的其他token设为inactive（一个用户每个平台保留一个active token）
                int deactivated = deviceTokenMapper.deactivateOtherTokensByPlatform(userId, request.getPlatform(), existing.getId());
                if (deactivated > 0) {
                    log.info("已停用该用户在 {} 平台的其他 {} 个旧token", request.getPlatform(), deactivated);
                }
            } else {
                // 注册新token前，先停用该用户在同平台的所有旧token
                int deactivated = deviceTokenMapper.deactivateAllByUserIdAndPlatform(userId, request.getPlatform());
                if (deactivated > 0) {
                    log.info("已停用该用户在 {} 平台的 {} 个旧token", request.getPlatform(), deactivated);
                }

                // 创建新记录
                LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);
                DeviceToken newToken = DeviceToken.builder()
                        .userId(userId)
                        .tenantId(tenantId)
                        .token(request.getToken())
                        .platform(request.getPlatform())
                        .deviceInfo(request.getDeviceInfo() != null ?
                                objectMapper.writeValueAsString(request.getDeviceInfo()) : null)
                        .isActive(true)
                        .lastUsedAt(nowUtc)
                        .createdAt(nowUtc)
                        .updatedAt(nowUtc)
                        .build();
                deviceTokenMapper.insert(newToken);
                log.info("创建设备Token成功 - id: {}", newToken.getId());
            }

            return ApiResponse.success(null);
        } catch (Exception e) {
            log.error("注册设备Token失败", e);
            return ApiResponse.error("Failed to register device token");
        }
    }

    /**
     * 注销设备Token (用户登出时调用)
     */
    @DeleteMapping
    public ApiResponse<Void> unregisterToken(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam String token) {

        log.info("注销设备Token - userId: {}, token: {}...",
                userId, token.substring(0, Math.min(10, token.length())));

        try {
            deviceTokenMapper.deactivateToken(token);
            return ApiResponse.success(null);
        } catch (Exception e) {
            log.error("注销设备Token失败", e);
            return ApiResponse.error("Failed to unregister device token");
        }
    }

    /**
     * 注销用户的所有设备Token (用于强制登出)
     */
    @DeleteMapping("/all")
    public ApiResponse<Void> unregisterAllTokens(
            @RequestHeader("X-User-Id") Long userId) {

        log.info("注销用户所有设备Token - userId: {}", userId);

        try {
            int count = deviceTokenMapper.deactivateAllByUserId(userId);
            log.info("已注销 {} 个设备Token", count);
            return ApiResponse.success(null);
        } catch (Exception e) {
            log.error("注销设备Token失败", e);
            return ApiResponse.error("Failed to unregister device tokens");
        }
    }
}
