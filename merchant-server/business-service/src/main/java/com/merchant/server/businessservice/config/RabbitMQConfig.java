package com.merchant.server.businessservice.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.merchant.server.common.constants.MQConstants;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ 配置类
 * 定义 Exchange, Queue, Binding 和消息转换器
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
     * RabbitAdmin 配置 - 用于自动创建队列、交换机和绑定
     */
    @Bean
    public RabbitAdmin rabbitAdmin(ConnectionFactory connectionFactory) {
        RabbitAdmin rabbitAdmin = new RabbitAdmin(connectionFactory);
        rabbitAdmin.setAutoStartup(true);
        return rabbitAdmin;
    }

    /**
     * RabbitTemplate 配置
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        // 开启消息确认
        rabbitTemplate.setMandatory(true);
        return rabbitTemplate;
    }

    // ==================== Exchange ====================

    /**
     * 通知主题 Exchange
     */
    @Bean
    public TopicExchange notificationExchange() {
        return ExchangeBuilder
                .topicExchange(MQConstants.NOTIFICATION_EXCHANGE)
                .durable(true)
                .build();
    }

    /**
     * 死信 Exchange
     */
    @Bean
    public DirectExchange dlxExchange() {
        return ExchangeBuilder
                .directExchange(MQConstants.DLX_EXCHANGE)
                .durable(true)
                .build();
    }

    // ==================== Queue ====================

    /**
     * 预约确认通知队列
     */
    @Bean
    public Queue appointmentConfirmationQueue() {
        return QueueBuilder
                .durable(MQConstants.QUEUE_APPOINTMENT_CONFIRMATION)
                .deadLetterExchange(MQConstants.DLX_EXCHANGE)
                .deadLetterRoutingKey(MQConstants.DLX_ROUTING_KEY)
                .ttl((int) MQConstants.DEFAULT_MESSAGE_TTL)
                .build();
    }

    /**
     * 预约取消通知队列
     */
    @Bean
    public Queue appointmentCancellationQueue() {
        return QueueBuilder
                .durable(MQConstants.QUEUE_APPOINTMENT_CANCELLATION)
                .deadLetterExchange(MQConstants.DLX_EXCHANGE)
                .deadLetterRoutingKey(MQConstants.DLX_ROUTING_KEY)
                .ttl((int) MQConstants.DEFAULT_MESSAGE_TTL)
                .build();
    }

    /**
     * 预约完成通知队列
     */
    @Bean
    public Queue appointmentCompletionQueue() {
        return QueueBuilder
                .durable(MQConstants.QUEUE_APPOINTMENT_COMPLETION)
                .deadLetterExchange(MQConstants.DLX_EXCHANGE)
                .deadLetterRoutingKey(MQConstants.DLX_ROUTING_KEY)
                .ttl((int) MQConstants.DEFAULT_MESSAGE_TTL)
                .build();
    }

    // TODO: These generic queues are deprecated, use scene-specific queues instead
    // /**
    //  * 预约提醒通知队列
    //  */
    // @Bean
    // public Queue appointmentReminderQueue() {
    //     return QueueBuilder
    //             .durable(MQConstants.QUEUE_APPOINTMENT_REMINDER)
    //             .deadLetterExchange(MQConstants.DLX_EXCHANGE)
    //             .deadLetterRoutingKey(MQConstants.DLX_ROUTING_KEY)
    //             .ttl((int) MQConstants.DEFAULT_MESSAGE_TTL)
    //             .build();
    // }

    // /**
    //  * 通用短信队列
    //  */
    // @Bean
    // public Queue smsQueue() {
    //     return QueueBuilder
    //             .durable(MQConstants.QUEUE_SMS)
    //             .deadLetterExchange(MQConstants.DLX_EXCHANGE)
    //             .deadLetterRoutingKey(MQConstants.DLX_ROUTING_KEY)
    //             .ttl((int) MQConstants.DEFAULT_MESSAGE_TTL)
    //             .build();
    // }

    // /**
    //  * 通用邮件队列
    //  */
    // @Bean
    // public Queue emailQueue() {
    //     return QueueBuilder
    //             .durable(MQConstants.QUEUE_EMAIL)
    //             .deadLetterExchange(MQConstants.DLX_EXCHANGE)
    //             .deadLetterRoutingKey(MQConstants.DLX_ROUTING_KEY)
    //             .ttl((int) MQConstants.DEFAULT_MESSAGE_TTL)
    //             .build();
    // }

    /**
     * 死信队列
     */
    @Bean
    public Queue dlqQueue() {
        return QueueBuilder
                .durable(MQConstants.QUEUE_DLQ)
                .build();
    }

    // ==================== Binding ====================

    /**
     * 预约确认队列绑定
     */
    @Bean
    public Binding appointmentConfirmationBinding(Queue appointmentConfirmationQueue, TopicExchange notificationExchange) {
        return BindingBuilder
                .bind(appointmentConfirmationQueue)
                .to(notificationExchange)
                .with(MQConstants.ROUTING_KEY_APPOINTMENT_CONFIRMATION);
    }

    /**
     * 预约取消队列绑定
     */
    @Bean
    public Binding appointmentCancellationBinding(Queue appointmentCancellationQueue, TopicExchange notificationExchange) {
        return BindingBuilder
                .bind(appointmentCancellationQueue)
                .to(notificationExchange)
                .with(MQConstants.ROUTING_KEY_APPOINTMENT_CANCELLATION);
    }

    /**
     * 预约完成队列绑定
     */
    @Bean
    public Binding appointmentCompletionBinding(Queue appointmentCompletionQueue, TopicExchange notificationExchange) {
        return BindingBuilder
                .bind(appointmentCompletionQueue)
                .to(notificationExchange)
                .with(MQConstants.ROUTING_KEY_APPOINTMENT_COMPLETION);
    }

    // TODO: These generic queue bindings are deprecated, use scene-specific bindings instead
    // /**
    //  * 预约提醒队列绑定
    //  */
    // @Bean
    // public Binding appointmentReminderBinding(Queue appointmentReminderQueue, TopicExchange notificationExchange) {
    //     return BindingBuilder
    //             .bind(appointmentReminderQueue)
    //             .to(notificationExchange)
    //             .with(MQConstants.ROUTING_KEY_APPOINTMENT_REMINDER);
    // }

    // /**
    //  * 短信队列绑定
    //  */
    // @Bean
    // public Binding smsBinding(Queue smsQueue, TopicExchange notificationExchange) {
    //     return BindingBuilder
    //             .bind(smsQueue)
    //             .to(notificationExchange)
    //             .with(MQConstants.ROUTING_KEY_SMS);
    // }

    // /**
    //  * 邮件队列绑定
    //  */
    // @Bean
    // public Binding emailBinding(Queue emailQueue, TopicExchange notificationExchange) {
    //     return BindingBuilder
    //             .bind(emailQueue)
    //             .to(notificationExchange)
    //             .with(MQConstants.ROUTING_KEY_EMAIL);
    // }

    /**
     * 死信队列绑定
     */
    @Bean
    public Binding dlqBinding(Queue dlqQueue, DirectExchange dlxExchange) {
        return BindingBuilder
                .bind(dlqQueue)
                .to(dlxExchange)
                .with(MQConstants.DLX_ROUTING_KEY);
    }
}
