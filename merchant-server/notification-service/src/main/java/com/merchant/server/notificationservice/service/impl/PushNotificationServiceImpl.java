package com.merchant.server.notificationservice.service.impl;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.*;
import com.google.firebase.messaging.AndroidConfig;
import com.google.firebase.messaging.AndroidNotification;
import com.google.firebase.messaging.ApnsConfig;
import com.google.firebase.messaging.Aps;
import com.google.firebase.messaging.ApsAlert;
import com.merchant.server.notificationservice.entity.DeviceToken;
import com.merchant.server.notificationservice.mapper.DeviceTokenMapper;
import com.merchant.server.notificationservice.service.PushNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * 推送通知服务实现
 * 使用Firebase Cloud Messaging (FCM) 发送推送通知
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PushNotificationServiceImpl implements PushNotificationService {

    private final DeviceTokenMapper deviceTokenMapper;

    @Value("${notification.firebase.enabled:false}")
    private boolean firebaseEnabled;

    @Value("${notification.mock.enabled:false}")
    private boolean mockEnabled;

    @Value("${notification.ios.bundle-id:com.vamerchant.app}")
    private String iosBundleId;

    @Override
    public boolean sendToDevice(String token, String title, String body, Map<String, String> data) {
        if (mockEnabled) {
            log.info("[MOCK] 发送推送通知 - token: {}..., title: {}, body: {}",
                    token.substring(0, Math.min(20, token.length())), title, body);
            return true;
        }

        if (!firebaseEnabled || FirebaseApp.getApps().isEmpty()) {
            log.warn("Firebase未启用或未初始化，跳过推送");
            return false;
        }

        try {
            // 从 data 中获取 badge 值，默认为 1
            int badgeCount = 1;
            if (data != null && data.containsKey("badge")) {
                try {
                    badgeCount = Integer.parseInt(data.get("badge"));
                } catch (NumberFormatException e) {
                    log.warn("Invalid badge value in data: {}", data.get("badge"));
                }
            }

            // 构建消息 - 使用平台特定配置
            Message.Builder messageBuilder = Message.builder()
                    .setToken(token);

            // iOS 配置 - 必须设置 APNs 特定配置才能正确投递
            ApnsConfig apnsConfig = ApnsConfig.builder()
                    .setAps(Aps.builder()
                            .setAlert(ApsAlert.builder()
                                    .setTitle(title)
                                    .setBody(body)
                                    .build())
                            .setSound("default")
                            .setBadge(badgeCount)
                            .build())
                    .putHeader("apns-topic", iosBundleId)  // 必须: iOS bundle ID
                    .putHeader("apns-push-type", "alert")   // 必须: 通知类型
                    .putHeader("apns-priority", "10")       // 高优先级
                    .build();
            messageBuilder.setApnsConfig(apnsConfig);

            // Android 配置
            AndroidConfig androidConfig = AndroidConfig.builder()
                    .setNotification(AndroidNotification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .setSound("default")
                            .build())
                    .setPriority(AndroidConfig.Priority.HIGH)
                    .build();
            messageBuilder.setAndroidConfig(androidConfig);

            // 添加自定义数据
            if (data != null && !data.isEmpty()) {
                messageBuilder.putAllData(data);
            }

            Message message = messageBuilder.build();
            log.info("准备发送推送通知 - token: {}..., title: {}, body: {}, apns-topic: {}",
                    token.substring(0, Math.min(30, token.length())), title, body, iosBundleId);

            String response = FirebaseMessaging.getInstance().send(message);
            log.info("推送通知发送成功 - messageId: {}, token: {}...",
                    response, token.substring(0, Math.min(30, token.length())));
            return true;
        } catch (FirebaseMessagingException e) {
            log.error("推送通知发送失败 - token: {}, errorCode: {}, error: {}",
                    token.substring(0, Math.min(20, token.length())),
                    e.getMessagingErrorCode(),
                    e.getMessage());

            // 只在 INVALID_ARGUMENT 时停用 token（token 格式错误）
            // UNREGISTERED 可能是临时状态，不要立即停用，让前端重新注册时自动更新
            if (e.getMessagingErrorCode() == MessagingErrorCode.INVALID_ARGUMENT) {
                log.info("Token格式无效，标记为失效状态");
                deviceTokenMapper.deactivateToken(token);
            } else if (e.getMessagingErrorCode() == MessagingErrorCode.UNREGISTERED) {
                log.warn("Token未注册或已过期，等待前端重新注册 - token: {}...",
                        token.substring(0, Math.min(20, token.length())));
                // 不停用，让前端重新注册时自动更新
            }
            return false;
        }
    }

    @Override
    public int sendToUser(Long userId, String title, String body, Map<String, String> data) {
        List<DeviceToken> tokens = deviceTokenMapper.findActiveByUserId(userId);
        if (tokens.isEmpty()) {
            log.debug("用户没有注册的设备token - userId: {}", userId);
            return 0;
        }
        return sendToDevices(tokens, title, body, data);
    }

    @Override
    public int sendToTenant(Long tenantId, String title, String body, Map<String, String> data) {
        List<DeviceToken> tokens = deviceTokenMapper.findActiveByTenantId(tenantId);
        if (tokens.isEmpty()) {
            log.warn("租户没有注册的设备token - tenantId: {}", tenantId);
            return 0;
        }
        // 打印详细的 token 信息用于调试
        log.info("查询到租户 {} 的活跃token数量: {}", tenantId, tokens.size());
        for (DeviceToken dt : tokens) {
            log.info("  - Token ID: {}, userId: {}, platform: {}, token: {}..., createdAt: {}, lastUsedAt: {}",
                    dt.getId(), dt.getUserId(), dt.getPlatform(),
                    dt.getToken().substring(0, Math.min(30, dt.getToken().length())),
                    dt.getCreatedAt(), dt.getLastUsedAt());
        }
        return sendToDevices(tokens, title, body, data);
    }

    @Override
    public int sendToDevices(List<DeviceToken> tokens, String title, String body, Map<String, String> data) {
        int successCount = 0;
        for (DeviceToken deviceToken : tokens) {
            if (sendToDevice(deviceToken.getToken(), title, body, data)) {
                successCount++;
                // 更新最后使用时间
                deviceTokenMapper.updateLastUsedAt(deviceToken.getId());
            }
        }
        log.info("批量推送完成 - 总数: {}, 成功: {}", tokens.size(), successCount);
        return successCount;
    }
}
