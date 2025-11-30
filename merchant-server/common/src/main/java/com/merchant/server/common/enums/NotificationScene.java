package com.merchant.server.common.enums;

/**
 * 通知业务场景枚举
 * 统一定义所有通知场景，便于管理和扩展
 */
public enum NotificationScene {

    // ============ 系统级通知（使用系统模板，tenant_id=1） ============

    /**
     * 商户注册成功 - 发送欢迎邮件
     */
    MERCHANT_REGISTER_WELCOME("merchant.register.welcome", "MERCHANT_WELCOME_EN", NotificationType.EMAIL, TemplateScope.SYSTEM),

    /**
     * 用户登录二次验证 - 发送验证码短信
     */
    USER_LOGIN_2FA("user.login.2fa", "LOGIN_2FA", NotificationType.SMS, TemplateScope.SYSTEM),

    /**
     * 预约结账成功 - 发送通知邮件给员工
     */
    APPOINTMENT_CHECKOUT_STAFF("appointment.checkout.staff", "APPOINTMENT_CHECKOUT_STAFF", NotificationType.EMAIL, TemplateScope.TENANT),

    /**
     * 员工每日预约汇总 - 发送汇总邮件
     */
    STAFF_DAILY_SUMMARY("staff.daily.summary", "STAFF_DAILY_SUMMARY", NotificationType.EMAIL, TemplateScope.TENANT),

    /**
     * 忘记密码 - 发送密码重置邮件
     */
    USER_FORGOT_PASSWORD("user.forgot.password", "PASSWORD_RESET", NotificationType.EMAIL, TemplateScope.SYSTEM),

    // ============ 商户级通知（使用商户自定义模板） ============

    /**
     * 套餐消费验证 - 发送验证码短信
     */
    PACKAGE_CONSUMPTION_VERIFY("package.consumption.verify", "PACKAGE_VERIFICATION", NotificationType.SMS, TemplateScope.TENANT),

    /**
     * 预约确认 - 发送给客户
     */
    APPOINTMENT_CONFIRMATION("appointment.confirmation", "APPOINTMENT_CONFIRMATION", NotificationType.BOTH, TemplateScope.TENANT),

    /**
     * 预约取消 - 发送给客户
     */
    APPOINTMENT_CANCELLATION("appointment.cancellation", "APPOINTMENT_CANCELLATION", NotificationType.BOTH, TemplateScope.TENANT),

    /**
     * 预约完成 - 发送给客户
     */
    APPOINTMENT_COMPLETION("appointment.completion", "APPOINTMENT_COMPLETION", NotificationType.BOTH, TemplateScope.TENANT),

    /**
     * 套餐购买成功 - 发送给客户
     */
    PACKAGE_PURCHASE_SUCCESS("package.purchase.success", "PACKAGE_PURCHASE_SUCCESS", NotificationType.EMAIL, TemplateScope.TENANT),

    /**
     * 预约提醒 - 发送给客户
     */
    APPOINTMENT_REMINDER("appointment.reminder", "APPOINTMENT_REMINDER", NotificationType.BOTH, TemplateScope.TENANT),

    /**
     * 营销提醒 - 发送给客户（召回不活跃客户）
     */
    MARKETING_REMINDER("marketing.reminder", "MARKETING_REMINDER", NotificationType.BOTH, TemplateScope.TENANT);

    /**
     * 场景唯一标识
     */
    private final String code;

    /**
     * 默认模板代码（如果不使用模板则为null）
     */
    private final String defaultTemplateCode;

    /**
     * 通知类型
     */
    private final NotificationType notificationType;

    /**
     * 模板范围
     */
    private final TemplateScope templateScope;

    NotificationScene(String code, String defaultTemplateCode, NotificationType notificationType, TemplateScope templateScope) {
        this.code = code;
        this.defaultTemplateCode = defaultTemplateCode;
        this.notificationType = notificationType;
        this.templateScope = templateScope;
    }

    public String getCode() {
        return code;
    }

    public String getDefaultTemplateCode() {
        return defaultTemplateCode;
    }

    public NotificationType getNotificationType() {
        return notificationType;
    }

    public TemplateScope getTemplateScope() {
        return templateScope;
    }

    /**
     * 是否使用模板
     */
    public boolean useTemplate() {
        return defaultTemplateCode != null;
    }

    /**
     * 是否是系统级模板
     */
    public boolean isSystemTemplate() {
        return templateScope == TemplateScope.SYSTEM;
    }

    /**
     * 根据code查找场景
     */
    public static NotificationScene fromCode(String code) {
        for (NotificationScene scene : values()) {
            if (scene.code.equals(code)) {
                return scene;
            }
        }
        throw new IllegalArgumentException("Unknown notification scene: " + code);
    }

    /**
     * 通知类型枚举
     */
    public enum NotificationType {
        EMAIL,      // 仅邮件
        SMS,        // 仅短信
        BOTH        // 邮件和短信都支持
    }

    /**
     * 模板范围枚举
     */
    public enum TemplateScope {
        SYSTEM,     // 系统级模板 (tenant_id=1)
        TENANT      // 商户级模板 (使用商户自己的tenant_id)
    }
}
