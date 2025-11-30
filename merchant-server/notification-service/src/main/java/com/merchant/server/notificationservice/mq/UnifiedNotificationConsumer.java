package com.merchant.server.notificationservice.mq;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.server.common.constants.MQConstants;
import com.merchant.server.common.dto.NotificationMessage;
import com.merchant.server.common.dto.NotificationRequest;
import com.merchant.server.notificationservice.processor.NotificationProcessor;
import com.rabbitmq.client.Channel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * 统一通知消费者
 * 只使用一个队列处理所有通知场景
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UnifiedNotificationConsumer {

    private final NotificationProcessor notificationProcessor;
    private final ObjectMapper objectMapper;

    // ==================== 系统级通知消费者 ====================

    /**
     * 处理商户注册欢迎邮件
     */
    @RabbitListener(id = "merchant-register-consumer", queues = MQConstants.QUEUE_MERCHANT_REGISTER)
    public void handleMerchantRegister(NotificationMessage message, Message amqpMessage, Channel channel) {
        handleNotification(message, amqpMessage, channel, "merchant-register");
    }

    /**
     * 处理用户登录二次验证短信
     */
    @RabbitListener(id = "user-login-2fa-consumer", queues = MQConstants.QUEUE_USER_LOGIN_2FA)
    public void handleUserLogin2FA(NotificationMessage message, Message amqpMessage, Channel channel) {
        handleNotification(message, amqpMessage, channel, "user-login-2fa");
    }

    /**
     * 处理忘记密码邮件
     */
    @RabbitListener(id = "user-forgot-password-consumer", queues = MQConstants.QUEUE_USER_FORGOT_PASSWORD)
    public void handleUserForgotPassword(NotificationMessage message, Message amqpMessage, Channel channel) {
        handleNotification(message, amqpMessage, channel, "user-forgot-password");
    }

    // ==================== 商户业务通知消费者 ====================

    /**
     * 处理套餐消费验证短信
     */
    @RabbitListener(id = "package-consumption-consumer", queues = MQConstants.QUEUE_PACKAGE_CONSUMPTION)
    public void handlePackageConsumption(NotificationMessage message, Message amqpMessage, Channel channel) {
        handleNotification(message, amqpMessage, channel, "package-consumption");
    }

    /**
     * 处理预约结账员工通知
     */
    @RabbitListener(id = "appointment-checkout-consumer", queues = MQConstants.QUEUE_APPOINTMENT_CHECKOUT)
    public void handleAppointmentCheckout(NotificationMessage message, Message amqpMessage, Channel channel) {
        handleNotification(message, amqpMessage, channel, "appointment-checkout");
    }

    /**
     * 处理员工每日汇总邮件
     */
    @RabbitListener(id = "staff-daily-summary-consumer", queues = MQConstants.QUEUE_STAFF_DAILY_SUMMARY)
    public void handleStaffDailySummary(NotificationMessage message, Message amqpMessage, Channel channel) {
        handleNotification(message, amqpMessage, channel, "staff-daily-summary");
    }

    /**
     * 处理预约确认通知
     */
    @RabbitListener(id = "appointment-confirmation-consumer", queues = MQConstants.QUEUE_APPOINTMENT_CONFIRMATION)
    public void handleAppointmentConfirmation(NotificationMessage message, Message amqpMessage, Channel channel) {
        handleNotification(message, amqpMessage, channel, "appointment-confirmation");
    }

    /**
     * 处理预约取消通知
     */
    @RabbitListener(id = "appointment-cancellation-consumer", queues = MQConstants.QUEUE_APPOINTMENT_CANCELLATION)
    public void handleAppointmentCancellation(NotificationMessage message, Message amqpMessage, Channel channel) {
        handleNotification(message, amqpMessage, channel, "appointment-cancellation");
    }

    /**
     * 处理预约完成通知
     */
    @RabbitListener(id = "appointment-completion-consumer", queues = MQConstants.QUEUE_APPOINTMENT_COMPLETION)
    public void handleAppointmentCompletion(NotificationMessage message, Message amqpMessage, Channel channel) {
        handleNotification(message, amqpMessage, channel, "appointment-completion");
    }

    /**
     * 处理预约提醒通知
     */
    @RabbitListener(id = "appointment-reminder-consumer", queues = MQConstants.QUEUE_APPOINTMENT_REMINDER)
    public void handleAppointmentReminder(NotificationMessage message, Message amqpMessage, Channel channel) {
        handleNotification(message, amqpMessage, channel, "appointment-reminder");
    }

    /**
     * 处理套餐购买成功通知
     */
    @RabbitListener(id = "package-purchase-consumer", queues = MQConstants.QUEUE_PACKAGE_PURCHASE)
    public void handlePackagePurchase(NotificationMessage message, Message amqpMessage, Channel channel) {
        handleNotification(message, amqpMessage, channel, "package-purchase");
    }

    /**
     * 处理营销通知
     */
    @RabbitListener(id = "marketing-consumer", queues = MQConstants.QUEUE_MARKETING)
    public void handleMarketing(NotificationMessage message, Message amqpMessage, Channel channel) {
        handleNotification(message, amqpMessage, channel, "marketing");
    }

    /**
     * 统一的通知处理逻辑
     * 所有业务队列的消息都通过这个方法处理
     */
    private void handleNotification(NotificationMessage message, Message amqpMessage, Channel channel, String queueName) {
        try {
            // 将payload转换为NotificationRequest
            NotificationRequest request = objectMapper.convertValue(message.getPayload(), NotificationRequest.class);

            log.info("📩 收到通知请求 - 场景: {}, 租户: {}, 渠道: {}, 收件人: {}",
                    request.getScene(), request.getTenantId(), request.getChannel(),
                    request.getRecipient().getEmail() != null ? request.getRecipient().getEmail() : request.getRecipient().getPhone());

            // 使用统一处理器处理
            notificationProcessor.process(request);

            // 确认消息
            channel.basicAck(amqpMessage.getMessageProperties().getDeliveryTag(), false);
            log.info("✅ 通知处理完成 - 场景: {}", request.getScene());

        } catch (Exception e) {
            // 只在第一次失败或严重错误时打印堆栈跟踪，避免日志爆炸
            if (message.getRetryCount() == 0 || e instanceof NullPointerException) {
                log.error("通知处理失败 - queue: {}, messageId: {}, retryCount: {}, 错误: {}",
                        queueName, message.getMessageId(), message.getRetryCount(), e.getMessage(), e);
            } else {
                log.warn("通知处理失败(重试中) - queue: {}, messageId: {}, retryCount: {}, 错误: {}",
                        queueName, message.getMessageId(), message.getRetryCount(), e.getMessage());
            }
            handleMessageFailure(message, amqpMessage, channel, e);
        }
    }

    /**
     * 处理死信队列消息
     * 无论成功或失败，都ACK确认，避免无限循环重试
     */
    @RabbitListener(id = "dlq-consumer", queues = MQConstants.QUEUE_DLQ)
    public void handleDeadLetter(NotificationMessage message, Message amqpMessage, Channel channel) {
        try {
            log.error("收到死信消息 - messageId: {}, type: {}, retryCount: {}, 将被丢弃",
                    message.getMessageId(), message.getMessageType(), message.getRetryCount());

            // 记录到数据库或发送告警（尝试记录，失败也不影响）
            try {
                // alertService.sendDeadLetterAlert(message);
                log.warn("死信消息详情 - payload: {}", message.getPayload());
            } catch (Exception e) {
                log.error("记录死信消息详情失败", e);
            }

            // 无论如何都ACK，避免死信消息无限循环
            channel.basicAck(amqpMessage.getMessageProperties().getDeliveryTag(), false);
            log.info("死信消息已确认并丢弃 - messageId: {}", message.getMessageId());

        } catch (Exception e) {
            log.error("处理死信消息失败 - messageId: {}, 强制ACK避免循环", message.getMessageId(), e);
            try {
                // 即使出错也强制ACK，避免无限重试
                channel.basicAck(amqpMessage.getMessageProperties().getDeliveryTag(), false);
            } catch (Exception ex) {
                log.error("ACK死信消息失败，消息可能会重新入队", ex);
            }
        }
    }

    /**
     * 处理消息失败
     */
    private void handleMessageFailure(NotificationMessage message, Message amqpMessage, Channel channel, Exception e) {
        try {
            message.incrementRetry();

            if (message.canRetry()) {
                // 还可以重试，拒绝消息并重新入队
                log.warn("消息将重试 - messageId: {}, retryCount: {}/{}",
                        message.getMessageId(), message.getRetryCount(), message.getMaxRetries());
                channel.basicNack(amqpMessage.getMessageProperties().getDeliveryTag(), false, true);
            } else {
                // 超过最大重试次数，拒绝消息并进入DLQ
                log.error("消息超过最大重试次数，发送到死信队列 - messageId: {}",
                        message.getMessageId());
                channel.basicNack(amqpMessage.getMessageProperties().getDeliveryTag(), false, false);
            }
        } catch (Exception ex) {
            log.error("处理消息失败时出错", ex);
        }
    }
}
