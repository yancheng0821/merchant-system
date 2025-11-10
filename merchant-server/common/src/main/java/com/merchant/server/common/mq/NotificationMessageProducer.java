package com.merchant.server.common.mq;

import com.merchant.server.common.constants.MQConstants;
import com.merchant.server.common.dto.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * 通知消息生产者 - 通用组件
 * 负责发送各类通知消息到 RabbitMQ
 *
 * 使用 @ConditionalOnClass 确保只有在引入 RabbitMQ 依赖时才加载
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnClass(RabbitTemplate.class)
public class NotificationMessageProducer {

    private final RabbitTemplate rabbitTemplate;

    /**
     * 发送通知消息到 MQ
     *
     * @param message    通知消息
     * @param routingKey Routing Key
     */
    public void sendNotification(NotificationMessage message, String routingKey) {
        try {
            // 如果消息ID为空，生成一个
            if (message.getMessageId() == null) {
                message.setMessageId(UUID.randomUUID().toString());
            }

            log.info("Sending notification message to MQ: messageId={}, type={}, routingKey={}",
                    message.getMessageId(), message.getMessageType(), routingKey);

            rabbitTemplate.convertAndSend(
                    MQConstants.NOTIFICATION_EXCHANGE,
                    routingKey,
                    message,
                    messagePostProcessor -> {
                        // 设置消息优先级
                        messagePostProcessor.getMessageProperties().setPriority(message.getPriority().getValue());
                        return messagePostProcessor;
                    }
            );

            log.info("Notification message sent successfully: messageId={}", message.getMessageId());
        } catch (Exception e) {
            log.error("Failed to send notification message to MQ: messageId={}, type={}, error={}",
                    message.getMessageId(), message.getMessageType(), e.getMessage(), e);
            throw new RuntimeException("Failed to send notification message", e);
        }
    }

    // ==================== 系统级通知 ====================

    /**
     * 发送商户注册欢迎邮件
     */
    public void sendMerchantRegisterWelcome(NotificationMessage message) {
        log.info("Sending merchant register welcome email via MQ: messageId={}", message.getMessageId());
        sendNotification(message, MQConstants.ROUTING_KEY_MERCHANT_REGISTER);
    }

    /**
     * 发送用户登录二次验证短信
     */
    public void sendUserLogin2FA(NotificationMessage message) {
        log.info("Sending user login 2FA SMS via MQ: messageId={}", message.getMessageId());
        sendNotification(message, MQConstants.ROUTING_KEY_USER_LOGIN_2FA);
    }

    /**
     * 发送忘记密码邮件
     */
    public void sendUserForgotPassword(NotificationMessage message) {
        log.info("Sending user forgot password email via MQ: messageId={}", message.getMessageId());
        sendNotification(message, MQConstants.ROUTING_KEY_USER_FORGOT_PASSWORD);
    }

    // ==================== 商户业务通知 ====================

    /**
     * 发送套餐消费验证短信
     */
    public void sendPackageConsumptionVerify(NotificationMessage message) {
        log.info("Sending package consumption verification SMS via MQ: messageId={}", message.getMessageId());
        sendNotification(message, MQConstants.ROUTING_KEY_PACKAGE_CONSUMPTION);
    }

    /**
     * 发送预约结账员工通知
     */
    public void sendAppointmentCheckoutStaff(NotificationMessage message) {
        log.info("Sending appointment checkout staff notification via MQ: messageId={}", message.getMessageId());
        sendNotification(message, MQConstants.ROUTING_KEY_APPOINTMENT_CHECKOUT);
    }

    /**
     * 发送员工每日汇总邮件
     */
    public void sendStaffDailySummary(NotificationMessage message) {
        log.info("Sending staff daily summary email via MQ: messageId={}", message.getMessageId());
        sendNotification(message, MQConstants.ROUTING_KEY_STAFF_DAILY_SUMMARY);
    }

    /**
     * 发送预约确认通知
     */
    public void sendAppointmentConfirmation(NotificationMessage message) {
        log.info("Sending appointment confirmation notification via MQ: messageId={}", message.getMessageId());
        sendNotification(message, MQConstants.ROUTING_KEY_APPOINTMENT_CONFIRMATION);
    }

    /**
     * 发送预约取消通知
     */
    public void sendAppointmentCancellation(NotificationMessage message) {
        log.info("Sending appointment cancellation notification via MQ: messageId={}", message.getMessageId());
        sendNotification(message, MQConstants.ROUTING_KEY_APPOINTMENT_CANCELLATION);
    }

    /**
     * 发送预约完成通知
     */
    public void sendAppointmentCompletion(NotificationMessage message) {
        log.info("Sending appointment completion notification via MQ: messageId={}", message.getMessageId());
        sendNotification(message, MQConstants.ROUTING_KEY_APPOINTMENT_COMPLETION);
    }

    /**
     * 发送预约提醒通知
     */
    public void sendAppointmentReminder(NotificationMessage message) {
        log.info("Sending appointment reminder notification via MQ: messageId={}", message.getMessageId());
        sendNotification(message, MQConstants.ROUTING_KEY_APPOINTMENT_REMINDER);
    }

    /**
     * 发送套餐购买成功通知
     */
    public void sendPackagePurchaseSuccess(NotificationMessage message) {
        log.info("Sending package purchase success notification via MQ: messageId={}", message.getMessageId());
        sendNotification(message, MQConstants.ROUTING_KEY_PACKAGE_PURCHASE);
    }
}
