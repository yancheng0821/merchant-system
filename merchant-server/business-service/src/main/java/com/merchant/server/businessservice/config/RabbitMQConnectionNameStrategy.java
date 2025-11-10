package com.merchant.server.businessservice.config;

import org.springframework.amqp.rabbit.connection.ConnectionNameStrategy;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.UnknownHostException;

/**
 * RabbitMQ 连接名称策略
 * 设置连接名称为服务名称，方便在RabbitMQ管理界面识别
 */
@Component
public class RabbitMQConnectionNameStrategy implements ConnectionNameStrategy {

    @Override
    public String obtainNewConnectionName(org.springframework.amqp.rabbit.connection.ConnectionFactory connectionFactory) {
        String hostname = "unknown";
        try {
            hostname = InetAddress.getLocalHost().getHostName();
        } catch (UnknownHostException e) {
            // 忽略异常，使用默认值
        }
        return "business-service@" + hostname;
    }
}
