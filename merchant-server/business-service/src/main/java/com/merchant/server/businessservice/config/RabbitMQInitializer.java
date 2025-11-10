package com.merchant.server.businessservice.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ 初始化器
 * 确保所有队列、交换机和绑定在应用启动时创建
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class RabbitMQInitializer {

    @Bean
    public ApplicationRunner initializeRabbitMQ(
            RabbitAdmin rabbitAdmin,
            TopicExchange notificationExchange,
            DirectExchange dlxExchange,
            Queue appointmentConfirmationQueue,
            Queue appointmentCancellationQueue,
            Queue appointmentCompletionQueue,
            Queue dlqQueue,
            Binding appointmentConfirmationBinding,
            Binding appointmentCancellationBinding,
            Binding appointmentCompletionBinding,
            Binding dlqBinding
    ) {
        return args -> {
            log.info("Initializing RabbitMQ exchanges, queues, and bindings...");

            // 声明交换机
            rabbitAdmin.declareExchange(notificationExchange);
            rabbitAdmin.declareExchange(dlxExchange);
            log.info("Exchanges declared: notification.topic, notification.dlx");

            // 声明队列 (只声明当前使用的场景队列)
            rabbitAdmin.declareQueue(appointmentConfirmationQueue);
            rabbitAdmin.declareQueue(appointmentCancellationQueue);
            rabbitAdmin.declareQueue(appointmentCompletionQueue);
            rabbitAdmin.declareQueue(dlqQueue);
            log.info("Queues declared: 4 queues created");

            // 声明绑定
            rabbitAdmin.declareBinding(appointmentConfirmationBinding);
            rabbitAdmin.declareBinding(appointmentCancellationBinding);
            rabbitAdmin.declareBinding(appointmentCompletionBinding);
            rabbitAdmin.declareBinding(dlqBinding);
            log.info("Bindings declared: 4 bindings created");

            log.info("✓ RabbitMQ initialization completed successfully!");
        };
    }
}
