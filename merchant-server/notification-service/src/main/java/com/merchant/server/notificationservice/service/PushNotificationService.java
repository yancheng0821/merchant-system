package com.merchant.server.notificationservice.service;

import com.merchant.server.notificationservice.entity.DeviceToken;

import java.util.List;
import java.util.Map;

/**
 * 推送通知服务接口
 */
public interface PushNotificationService {

    /**
     * 发送推送通知给单个设备
     *
     * @param token   设备Token
     * @param title   通知标题
     * @param body    通知内容
     * @param data    附加数据
     * @return 是否发送成功
     */
    boolean sendToDevice(String token, String title, String body, Map<String, String> data);

    /**
     * 发送推送通知给用户的所有设备
     *
     * @param userId  用户ID
     * @param title   通知标题
     * @param body    通知内容
     * @param data    附加数据
     * @return 成功发送的设备数
     */
    int sendToUser(Long userId, String title, String body, Map<String, String> data);

    /**
     * 发送推送通知给租户下的所有用户
     *
     * @param tenantId 租户ID
     * @param title    通知标题
     * @param body     通知内容
     * @param data     附加数据
     * @return 成功发送的设备数
     */
    int sendToTenant(Long tenantId, String title, String body, Map<String, String> data);

    /**
     * 批量发送推送通知
     *
     * @param tokens  设备Token列表
     * @param title   通知标题
     * @param body    通知内容
     * @param data    附加数据
     * @return 成功发送的设备数
     */
    int sendToDevices(List<DeviceToken> tokens, String title, String body, Map<String, String> data);
}
