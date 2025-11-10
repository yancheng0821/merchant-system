package com.merchant.server.common.annotation;

import java.lang.annotation.*;

/**
 * 权限检查注解
 * 用于方法级别的权限控制
 *
 * 使用示例:
 * @RequiresPermission(resource = "products", action = "create")
 * 或
 * @RequiresPermission(value = "products:create")
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequiresPermission {

    /**
     * 权限代码 (格式: resource:action，如: products:create)
     * 如果指定此值，则resource和action将被忽略
     */
    String value() default "";

    /**
     * 资源模块 (如: products, customers, orders)
     */
    String resource() default "";

    /**
     * 操作类型 (如: view, create, update, delete)
     */
    String action() default "";

    /**
     * 是否需要指定的数据范围
     * 如果为true，则只有拥有'all'范围的权限才能通过
     */
    boolean requireFullScope() default false;

    /**
     * 错误提示消息
     */
    String message() default "Access denied: insufficient permissions";
}
