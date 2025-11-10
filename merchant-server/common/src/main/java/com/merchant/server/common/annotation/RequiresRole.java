package com.merchant.server.common.annotation;

import java.lang.annotation.*;

/**
 * 角色检查注解
 * 用于方法级别的角色控制
 *
 * 使用示例:
 * @RequiresRole("MANAGER")
 * 或
 * @RequiresRole(value = {"MANAGER", "SUPER_ADMIN"}, logical = Logical.OR)
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequiresRole {

    /**
     * 角色代码数组
     */
    String[] value();

    /**
     * 逻辑关系：AND表示需要所有角色，OR表示只需其中一个角色
     */
    Logical logical() default Logical.OR;

    /**
     * 错误提示消息
     */
    String message() default "Access denied: required role not found";

    /**
     * 逻辑枚举
     */
    enum Logical {
        AND, OR
    }
}
