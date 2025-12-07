package com.merchant.server.notificationservice.controller;

import com.merchant.server.common.dto.ApiResponse;
import com.merchant.server.notificationservice.dto.PushNotificationRequest;
import com.merchant.server.notificationservice.service.PushNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * 推送通知控制器
 * 用于触发FCM推送通知
 */
@Slf4j
@RestController
@RequestMapping("/api/notification/push")
@RequiredArgsConstructor
public class PushNotificationController {

    private final PushNotificationService pushNotificationService;

    /**
     * 发送推送通知给指定用户
     */
    @PostMapping("/user/{userId}")
    public ApiResponse<Integer> sendToUser(
            @PathVariable Long userId,
            @RequestBody PushNotificationRequest request) {

        log.info("发送推送通知给用户 - userId: {}, title: {}", userId, request.getTitle());

        int count = pushNotificationService.sendToUser(
                userId,
                request.getTitle(),
                request.getBody(),
                request.getData()
        );

        return ApiResponse.success(count);
    }

    /**
     * 发送推送通知给租户下的所有用户
     */
    @PostMapping("/tenant/{tenantId}")
    public ApiResponse<Integer> sendToTenant(
            @PathVariable Long tenantId,
            @RequestBody PushNotificationRequest request) {

        log.info("发送推送通知给租户 - tenantId: {}, title: {}", tenantId, request.getTitle());

        int count = pushNotificationService.sendToTenant(
                tenantId,
                request.getTitle(),
                request.getBody(),
                request.getData()
        );

        return ApiResponse.success(count);
    }

    /**
     * 发送推送通知给单个设备
     */
    @PostMapping("/device")
    public ApiResponse<Boolean> sendToDevice(@RequestBody PushNotificationRequest request) {
        log.info("发送推送通知给设备 - token: {}..., title: {}",
                request.getToken() != null ? request.getToken().substring(0, Math.min(20, request.getToken().length())) : "null",
                request.getTitle());

        boolean success = pushNotificationService.sendToDevice(
                request.getToken(),
                request.getTitle(),
                request.getBody(),
                request.getData()
        );

        return ApiResponse.success(success);
    }
}
