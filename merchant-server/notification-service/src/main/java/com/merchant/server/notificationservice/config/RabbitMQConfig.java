package com.merchant.server.notificationservice.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.merchant.server.common.constants.MQConstants;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

/**
 * RabbitMQ 配置类 - Notification Service
 * 配置消息转换器和监听器工厂
 */
@Configuration
public class RabbitMQConfig {

    /**
     * JSON 消息转换器
     * 配置支持 Java 8 时间类型（LocalDateTime）
     */
    @Bean
    public MessageConverter jsonMessageConverter() {
        ObjectMapper objectMapper = new ObjectMapper();
        // 注册 JavaTimeModule 以支持 LocalDateTime 等 Java 8 时间类型
        objectMapper.registerModule(new JavaTimeModule());
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    /**
     * Rabbit Listener Container Factory
     */
    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            MessageConverter jsonMessageConverter) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jsonMessageConverter);
        factory.setAcknowledgeMode(AcknowledgeMode.MANUAL); // 显式设置手动确认模式
        factory.setDefaultRequeueRejected(false); // 失败消息不重新入队，进入DLQ

        // 设置 Consumer Tag 策略：基于队列名生成易识别的 consumer tag
        factory.setConsumerTagStrategy(queue -> {
            // 移除队列名前缀，只保留业务类型部分
            String queueName = queue.replace("notification.", "");
            return queueName + "-consumer";
        });

        return factory;
    }

    // ==================== Exchange ====================

    /**
     * 通知主题 Exchange
     */
    @Bean
    public TopicExchange notificationExchange() {
        return new TopicExchange(MQConstants.NOTIFICATION_EXCHANGE, true, false);
    }

    /**
     * 死信 Exchange
     */
    @Bean
    public DirectExchange dlxExchange() {
        return new DirectExchange(MQConstants.DLX_EXCHANGE, true, false);
    }

    // ==================== 死信队列 ====================

    /**
     * 死信队列
     */
    @Bean
    public Queue dlq() {
        return new Queue(MQConstants.QUEUE_DLQ, true);
    }

    /**
     * 死信队列绑定
     */
    @Bean
    public Binding dlqBinding() {
        return BindingBuilder.bind(dlq())
                .to(dlxExchange())
                .with(MQConstants.DLX_ROUTING_KEY);
    }

    // ==================== 系统级通知队列 ====================

    /**
     * 商户注册欢迎邮件队列
     */
    @Bean
    public Queue merchantRegisterQueue() {
        return createQueueWithDLX(MQConstants.QUEUE_MERCHANT_REGISTER);
    }

    @Bean
    public Binding merchantRegisterBinding() {
        return BindingBuilder.bind(merchantRegisterQueue())
                .to(notificationExchange())
                .with(MQConstants.ROUTING_KEY_MERCHANT_REGISTER);
    }

    /**
     * 用户登录二次验证队列
     */
    @Bean
    public Queue userLogin2FAQueue() {
        return createQueueWithDLX(MQConstants.QUEUE_USER_LOGIN_2FA);
    }

    @Bean
    public Binding userLogin2FABinding() {
        return BindingBuilder.bind(userLogin2FAQueue())
                .to(notificationExchange())
                .with(MQConstants.ROUTING_KEY_USER_LOGIN_2FA);
    }

    /**
     * 忘记密码邮件队列
     */
    @Bean
    public Queue userForgotPasswordQueue() {
        return createQueueWithDLX(MQConstants.QUEUE_USER_FORGOT_PASSWORD);
    }

    @Bean
    public Binding userForgotPasswordBinding() {
        return BindingBuilder.bind(userForgotPasswordQueue())
                .to(notificationExchange())
                .with(MQConstants.ROUTING_KEY_USER_FORGOT_PASSWORD);
    }

    // ==================== 商户业务通知队列 ====================

    /**
     * 套餐消费验证队列
     */
    @Bean
    public Queue packageConsumptionQueue() {
        return createQueueWithDLX(MQConstants.QUEUE_PACKAGE_CONSUMPTION);
    }

    @Bean
    public Binding packageConsumptionBinding() {
        return BindingBuilder.bind(packageConsumptionQueue())
                .to(notificationExchange())
                .with(MQConstants.ROUTING_KEY_PACKAGE_CONSUMPTION);
    }

    /**
     * 预约结账员工通知队列
     */
    @Bean
    public Queue appointmentCheckoutQueue() {
        return createQueueWithDLX(MQConstants.QUEUE_APPOINTMENT_CHECKOUT);
    }

    @Bean
    public Binding appointmentCheckoutBinding() {
        return BindingBuilder.bind(appointmentCheckoutQueue())
                .to(notificationExchange())
                .with(MQConstants.ROUTING_KEY_APPOINTMENT_CHECKOUT);
    }

    /**
     * 员工每日汇总队列
     */
    @Bean
    public Queue staffDailySummaryQueue() {
        return createQueueWithDLX(MQConstants.QUEUE_STAFF_DAILY_SUMMARY);
    }

    @Bean
    public Binding staffDailySummaryBinding() {
        return BindingBuilder.bind(staffDailySummaryQueue())
                .to(notificationExchange())
                .with(MQConstants.ROUTING_KEY_STAFF_DAILY_SUMMARY);
    }

    /**
     * 预约确认通知队列
     */
    @Bean
    public Queue appointmentConfirmationQueue() {
        return createQueueWithDLX(MQConstants.QUEUE_APPOINTMENT_CONFIRMATION);
    }

    @Bean
    public Binding appointmentConfirmationBinding() {
        return BindingBuilder.bind(appointmentConfirmationQueue())
                .to(notificationExchange())
                .with(MQConstants.ROUTING_KEY_APPOINTMENT_CONFIRMATION);
    }

    /**
     * 预约取消通知队列
     */
    @Bean
    public Queue appointmentCancellationQueue() {
        return createQueueWithDLX(MQConstants.QUEUE_APPOINTMENT_CANCELLATION);
    }

    @Bean
    public Binding appointmentCancellationBinding() {
        return BindingBuilder.bind(appointmentCancellationQueue())
                .to(notificationExchange())
                .with(MQConstants.ROUTING_KEY_APPOINTMENT_CANCELLATION);
    }

    /**
     * 预约完成通知队列
     */
    @Bean
    public Queue appointmentCompletionQueue() {
        return createQueueWithDLX(MQConstants.QUEUE_APPOINTMENT_COMPLETION);
    }

    @Bean
    public Binding appointmentCompletionBinding() {
        return BindingBuilder.bind(appointmentCompletionQueue())
                .to(notificationExchange())
                .with(MQConstants.ROUTING_KEY_APPOINTMENT_COMPLETION);
    }

    /**
     * 预约提醒通知队列
     */
    @Bean
    public Queue appointmentReminderQueue() {
        return createQueueWithDLX(MQConstants.QUEUE_APPOINTMENT_REMINDER);
    }

    @Bean
    public Binding appointmentReminderBinding() {
        return BindingBuilder.bind(appointmentReminderQueue())
                .to(notificationExchange())
                .with(MQConstants.ROUTING_KEY_APPOINTMENT_REMINDER);
    }

    /**
     * 套餐购买成功队列
     */
    @Bean
    public Queue packagePurchaseQueue() {
        return createQueueWithDLX(MQConstants.QUEUE_PACKAGE_PURCHASE);
    }

    @Bean
    public Binding packagePurchaseBinding() {
        return BindingBuilder.bind(packagePurchaseQueue())
                .to(notificationExchange())
                .with(MQConstants.ROUTING_KEY_PACKAGE_PURCHASE);
    }

    // ==================== 辅助方法 ====================

    /**
     * 创建带死信配置的队列
     */
    private Queue createQueueWithDLX(String queueName) {
        Map<String, Object> args = new HashMap<>();
        args.put("x-dead-letter-exchange", MQConstants.DLX_EXCHANGE);
        args.put("x-dead-letter-routing-key", MQConstants.DLX_ROUTING_KEY);
        args.put("x-message-ttl", MQConstants.DEFAULT_MESSAGE_TTL);
        return new Queue(queueName, true, false, false, args);
    }
}
