package com.merchant.server.businessservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Map;

/**
 * 通知服务 Feign 客户端
 * 用于调用 notification-service 的接口
 */
@FeignClient(name = "notification-service", path = "/api")
public interface NotificationClient {

    /**
     * 发送短信
     */
    @PostMapping("/notifications/sms/send")
    Map<String, Object> sendSms(@RequestBody Map<String, Object> request);

    /**
     * 发送模板化邮件
     */
    @PostMapping("/notification/email/template")
    String sendTemplatedEmail(@RequestBody Map<String, Object> request);

    /**
     * 发送预约确认通知
     */
    @PostMapping("/v2/appointment-notifications/confirmation")
    String sendAppointmentConfirmation(@RequestBody Object notification);

    /**
     * 发送预约取消通知
     */
    @PostMapping("/v2/appointment-notifications/cancellation")
    String sendAppointmentCancellation(@RequestBody Object notification);

    /**
     * 发送预约完成通知
     */
    @PostMapping("/v2/appointment-notifications/completion")
    String sendAppointmentCompletion(@RequestBody Object notification);

    /**
     * 发送预约提醒通知
     */
    @PostMapping("/v2/appointment-notifications/reminder")
    String sendAppointmentReminder(@RequestBody Object notification);

    /**
     * 发送推送通知给租户下的所有用户
     */
    @PostMapping("/notification/push/tenant/{tenantId}")
    Object sendPushToTenant(@org.springframework.web.bind.annotation.PathVariable("tenantId") Long tenantId, @RequestBody Map<String, Object> request);

    /**
     * 发送推送通知给指定用户
     */
    @PostMapping("/notification/push/user/{userId}")
    Object sendPushToUser(@org.springframework.web.bind.annotation.PathVariable("userId") Long userId, @RequestBody Map<String, Object> request);
}
