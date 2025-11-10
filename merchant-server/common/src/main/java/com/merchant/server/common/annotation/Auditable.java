package com.merchant.server.common.annotation;

import java.lang.annotation.*;

/**
 * 审计日志注解
 * 用于标记需要记录审计日志的方法
 *
 * 使用示例：
 * @Auditable(resource = "USER", action = "CREATE")
 * public Result createUser(UserDTO dto) { ... }
 *
 * @Auditable(resource = "USER", action = "UPDATE", recordOldValue = true, resourceIdParam = "id")
 * public Result updateUser(Long id, UserDTO dto) { ... }
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Auditable {

    /**
     * 资源类型（如：USER, ROLE, APPOINTMENT, ORDER等）
     * 必填项
     */
    String resource();

    /**
     * 操作类型（如：CREATE, UPDATE, DELETE, VIEW等）
     * 必填项
     */
    String action();

    /**
     * 是否记录旧值（主要用于UPDATE操作）
     * 默认false，如果为true，会在执行前查询旧值
     */
    boolean recordOldValue() default false;

    /**
     * 资源ID的参数名或字段名
     * 用于从方法参数或返回值中提取资源ID
     * 默认为"id"
     */
    String resourceIdParam() default "id";

    /**
     * 详细描述（可选）
     * 用于提供更详细的操作说明
     */
    String description() default "";
}
