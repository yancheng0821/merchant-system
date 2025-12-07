package com.merchant.server.common.annotation;

import java.lang.annotation.*;

/**
 * 订阅功能检查注解
 * 用于方法级别的订阅功能控制
 *
 * 使用示例:
 * @RequiresFeature("customerImport")
 * @RequiresFeature(value = "smsNotification", message = "SMS功能需要升级到PRO版本")
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequiresFeature {

    /**
     * 功能代码（如: customerImport, smsNotification, notificationTemplateEdit）
     */
    String value();

    /**
     * 检查类型
     */
    FeatureType type() default FeatureType.FEATURE;

    /**
     * 错误提示消息
     */
    String message() default "此功能需要升级订阅计划";

    /**
     * 功能类型枚举
     */
    enum FeatureType {
        /**
         * 功能级别 - 检查 features 节点
         */
        FEATURE,
        /**
         * 模块级别 - 检查 modules 节点
         */
        MODULE
    }
}
