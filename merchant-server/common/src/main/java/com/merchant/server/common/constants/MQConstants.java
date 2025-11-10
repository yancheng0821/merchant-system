package com.merchant.server.common.constants;

/**
 * MQ 常量定义
 * RabbitMQ Exchange, Queue, Routing Key 等常量
 */
public class MQConstants {

    // ==================== Exchange ====================
    /**
     * 通知主题 Exchange
     */
    public static final String NOTIFICATION_EXCHANGE = "notification.topic";

    // ==================== Queue ====================
    // 系统级通知队列
    /**
     * 商户注册欢迎邮件队列
     */
    public static final String QUEUE_MERCHANT_REGISTER = "notification.merchant.register";

    /**
     * 用户登录二次验证队列
     */
    public static final String QUEUE_USER_LOGIN_2FA = "notification.user.login.2fa";

    /**
     * 忘记密码邮件队列
     */
    public static final String QUEUE_USER_FORGOT_PASSWORD = "notification.user.forgot.password";

    // 商户业务通知队列
    /**
     * 套餐消费验证队列
     */
    public static final String QUEUE_PACKAGE_CONSUMPTION = "notification.package.consumption";

    /**
     * 预约结账员工通知队列
     */
    public static final String QUEUE_APPOINTMENT_CHECKOUT = "notification.appointment.checkout";

    /**
     * 员工每日汇总队列
     */
    public static final String QUEUE_STAFF_DAILY_SUMMARY = "notification.staff.daily.summary";

    /**
     * 预约确认通知队列（客户）
     */
    public static final String QUEUE_APPOINTMENT_CONFIRMATION = "notification.appointment.confirmation";

    /**
     * 预约取消通知队列（客户）
     */
    public static final String QUEUE_APPOINTMENT_CANCELLATION = "notification.appointment.cancellation";

    /**
     * 预约完成通知队列（客户）
     */
    public static final String QUEUE_APPOINTMENT_COMPLETION = "notification.appointment.completion";

    /**
     * 预约提醒通知队列（客户）
     */
    public static final String QUEUE_APPOINTMENT_REMINDER = "notification.appointment.reminder";

    /**
     * 套餐购买成功队列
     */
    public static final String QUEUE_PACKAGE_PURCHASE = "notification.package.purchase";

    /**
     * 死信队列
     */
    public static final String QUEUE_DLQ = "notification.dlq";

    // ==================== Routing Key ====================
    // 系统级通知路由键
    /**
     * 商户注册欢迎邮件 Routing Key
     */
    public static final String ROUTING_KEY_MERCHANT_REGISTER = "merchant.register";

    /**
     * 用户登录二次验证 Routing Key
     */
    public static final String ROUTING_KEY_USER_LOGIN_2FA = "user.login.2fa";

    /**
     * 忘记密码邮件 Routing Key
     */
    public static final String ROUTING_KEY_USER_FORGOT_PASSWORD = "user.forgot.password";

    // 商户业务通知路由键
    /**
     * 套餐消费验证 Routing Key
     */
    public static final String ROUTING_KEY_PACKAGE_CONSUMPTION = "package.consumption";

    /**
     * 预约结账员工通知 Routing Key
     */
    public static final String ROUTING_KEY_APPOINTMENT_CHECKOUT = "appointment.checkout";

    /**
     * 员工每日汇总 Routing Key
     */
    public static final String ROUTING_KEY_STAFF_DAILY_SUMMARY = "staff.daily.summary";

    /**
     * 预约确认通知 Routing Key
     */
    public static final String ROUTING_KEY_APPOINTMENT_CONFIRMATION = "appointment.confirmation";

    /**
     * 预约取消通知 Routing Key
     */
    public static final String ROUTING_KEY_APPOINTMENT_CANCELLATION = "appointment.cancellation";

    /**
     * 预约完成通知 Routing Key
     */
    public static final String ROUTING_KEY_APPOINTMENT_COMPLETION = "appointment.completion";

    /**
     * 预约提醒通知 Routing Key
     */
    public static final String ROUTING_KEY_APPOINTMENT_REMINDER = "appointment.reminder";

    /**
     * 套餐购买成功 Routing Key
     */
    public static final String ROUTING_KEY_PACKAGE_PURCHASE = "package.purchase";

    // ==================== Dead Letter ====================
    /**
     * 死信 Exchange
     */
    public static final String DLX_EXCHANGE = "notification.dlx";

    /**
     * 死信 Routing Key
     */
    public static final String DLX_ROUTING_KEY = "dlx";

    // ==================== Message TTL ====================
    /**
     * 消息默认 TTL (毫秒) - 24小时
     */
    public static final long DEFAULT_MESSAGE_TTL = 86400000L;

    /**
     * 紧急消息 TTL (毫秒) - 1小时
     */
    public static final long URGENT_MESSAGE_TTL = 3600000L;

    // ==================== Retry ====================
    /**
     * 默认最大重试次数
     */
    public static final int DEFAULT_MAX_RETRIES = 3;

    /**
     * 重试间隔 (毫秒)
     */
    public static final long RETRY_INTERVAL = 3000L;
}
