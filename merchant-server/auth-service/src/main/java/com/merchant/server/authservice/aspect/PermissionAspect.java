package com.merchant.server.authservice.aspect;

import com.merchant.server.common.annotation.RequiresPermission;
import com.merchant.server.common.annotation.RequiresRole;
import com.merchant.server.authservice.dto.CheckPermissionResponse;
import com.merchant.server.authservice.service.AuthorizationService;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.lang.reflect.Method;

/**
 * 权限检查AOP拦截器
 *
 * Note: 审计日志功能已分离到 @Auditable 注解和 AuditAspect
 */
@Slf4j
@Aspect
@Component
public class PermissionAspect {

    private final AuthorizationService authorizationService;

    public PermissionAspect(AuthorizationService authorizationService) {
        this.authorizationService = authorizationService;
    }

    /**
     * 拦截 @RequiresPermission 注解
     */
    @Around("@annotation(com.merchant.server.common.annotation.RequiresPermission) || " +
            "@within(com.merchant.server.common.annotation.RequiresPermission)")
    public Object checkPermission(ProceedingJoinPoint joinPoint) throws Throwable {
        // 获取方法签名
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();

        // 获取注解
        RequiresPermission annotation = method.getAnnotation(RequiresPermission.class);
        if (annotation == null) {
            annotation = method.getDeclaringClass().getAnnotation(RequiresPermission.class);
        }

        if (annotation == null) {
            return joinPoint.proceed();
        }

        // 从请求中获取用户信息
        HttpServletRequest request = getCurrentRequest();
        if (request == null) {
            throw new SecurityException("Cannot get current request");
        }

        // 从Gateway传递的Header中获取用户ID和租户ID
        // Gateway已经完成了JWT验证，这里直接信任Header中的信息
        String userIdHeader = request.getHeader("X-User-Id");
        String tenantIdHeader = request.getHeader("X-Tenant-Id");

        if (userIdHeader == null || userIdHeader.isEmpty()) {
            throw new SecurityException("User ID not found in request header (missing Gateway authentication)");
        }

        Long userId = Long.parseLong(userIdHeader);
        Long tenantId = (tenantIdHeader != null && !tenantIdHeader.isEmpty())
            ? Long.parseLong(tenantIdHeader)
            : null;

        // 解析权限要求
        String resource;
        String action;

        if (!annotation.value().isEmpty()) {
            // 使用权限代码
            String[] parts = annotation.value().split(":");
            resource = parts[0];
            action = parts.length > 1 ? parts[1] : "view";
        } else {
            // 使用resource和action
            resource = annotation.resource();
            action = annotation.action();
        }

        log.debug("Checking permission: user={}, resource={}, action={}", userId, resource, action);

        // 执行权限检查
        CheckPermissionResponse result = authorizationService.checkPermission(userId, tenantId, resource, action);

        if (!result.getHasPermission()) {
            log.warn("Permission denied: user={}, resource={}, action={}, reason={}",
                    userId, resource, action, result.getReason());
            throw new SecurityException(annotation.message() + ": " + result.getReason());
        }

        // 检查数据范围要求
        if (annotation.requireFullScope() && !"all".equals(result.getScope())) {
            log.warn("Full scope required but user has scope: {}", result.getScope());
            throw new SecurityException(annotation.message() + ": Full scope required");
        }

        log.debug("Permission granted: user={}, resource={}, action={}, scope={}",
                userId, resource, action, result.getScope());

        // 权限检查通过，继续执行方法
        return joinPoint.proceed();
    }

    /**
     * 拦截 @RequiresRole 注解
     */
    @Around("@annotation(com.merchant.server.common.annotation.RequiresRole) || " +
            "@within(com.merchant.server.common.annotation.RequiresRole)")
    public Object checkRole(ProceedingJoinPoint joinPoint) throws Throwable {
        // 获取方法签名
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();

        // 获取注解
        RequiresRole annotation = method.getAnnotation(RequiresRole.class);
        if (annotation == null) {
            annotation = method.getDeclaringClass().getAnnotation(RequiresRole.class);
        }

        if (annotation == null) {
            return joinPoint.proceed();
        }

        // 从请求中获取用户信息
        HttpServletRequest request = getCurrentRequest();
        if (request == null) {
            throw new SecurityException("Cannot get current request");
        }

        // 从Gateway传递的Header中获取用户ID和租户ID
        // Gateway已经完成了JWT验证，这里直接信任Header中的信息
        String userIdHeader = request.getHeader("X-User-Id");
        String tenantIdHeader = request.getHeader("X-Tenant-Id");

        if (userIdHeader == null || userIdHeader.isEmpty()) {
            throw new SecurityException("User ID not found in request header (missing Gateway authentication)");
        }

        Long userId = Long.parseLong(userIdHeader);
        Long tenantId = (tenantIdHeader != null && !tenantIdHeader.isEmpty())
            ? Long.parseLong(tenantIdHeader)
            : null;

        // 检查角色
        String[] requiredRoles = annotation.value();
        boolean hasRole;

        if (annotation.logical() == RequiresRole.Logical.AND) {
            // AND逻辑：需要所有角色
            hasRole = true;
            for (String roleCode : requiredRoles) {
                if (!authorizationService.hasRole(userId, roleCode, tenantId)) {
                    hasRole = false;
                    break;
                }
            }
        } else {
            // OR逻辑：只需其中一个角色
            hasRole = false;
            for (String roleCode : requiredRoles) {
                if (authorizationService.hasRole(userId, roleCode, tenantId)) {
                    hasRole = true;
                    break;
                }
            }
        }

        if (!hasRole) {
            log.warn("Role check failed: user={}, required roles={}", userId, String.join(",", requiredRoles));
            throw new SecurityException(annotation.message());
        }

        log.debug("Role check passed: user={}, roles={}", userId, String.join(",", requiredRoles));

        // 角色检查通过，继续执行方法
        return joinPoint.proceed();
    }

    /**
     * 获取当前HTTP请求
     */
    private HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }
}
