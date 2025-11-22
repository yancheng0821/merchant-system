package com.merchant.server.authservice.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.server.authservice.entity.AuditLog;
import com.merchant.server.authservice.entity.User;
import com.merchant.server.authservice.entity.Role;
import com.merchant.server.authservice.entity.Tenant;
import com.merchant.server.authservice.service.AuditLogService;
import com.merchant.server.authservice.service.UserService;
import com.merchant.server.authservice.service.RoleService;
import com.merchant.server.authservice.service.TenantService;
import com.merchant.server.authservice.util.JwtUtil;
import com.merchant.server.common.annotation.Auditable;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 审计日志AOP切面
 * 拦截@Auditable注解，自动记录审计日志
 */
@Slf4j
@Aspect
@Component
public class AuditAspect {

    private final AuditLogService auditLogService;
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;
    private final ApplicationContext applicationContext;

    public AuditAspect(AuditLogService auditLogService, JwtUtil jwtUtil, ApplicationContext applicationContext) {
        this.auditLogService = auditLogService;
        this.jwtUtil = jwtUtil;
        this.objectMapper = new ObjectMapper();
        this.applicationContext = applicationContext;
    }

    /**
     * 拦截 @Auditable 注解的方法
     */
    @Around("@annotation(auditable)")
    public Object auditMethod(ProceedingJoinPoint joinPoint, Auditable auditable) throws Throwable {
        // 获取请求信息
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        HttpServletRequest request = attributes != null ? attributes.getRequest() : null;

        // 提取用户信息
        Long userId = null;
        Long tenantId = null;
        if (request != null) {
            String token = extractToken(request);
            if (token != null) {
                try {
                    userId = jwtUtil.extractUserId(token);
                    tenantId = jwtUtil.extractTenantId(token);
                } catch (Exception e) {
                    log.debug("Failed to extract user info from token: {}", e.getMessage());
                }
            }
        }

        // 记录旧值（如果需要）
        Object oldValue = null;
        if (auditable.recordOldValue()) {
            try {
                oldValue = fetchOldValue(joinPoint, auditable);
            } catch (Exception e) {
                log.warn("Failed to fetch old value: {}", e.getMessage());
            }
        }

        // 执行原方法
        Object result = null;
        Throwable exception = null;
        long startTime = System.currentTimeMillis();

        try {
            result = joinPoint.proceed();
        } catch (Throwable e) {
            exception = e;
            throw e;
        } finally {
            long duration = System.currentTimeMillis() - startTime;

            // 异步记录审计日志
            recordAuditLog(
                userId,
                tenantId,
                auditable,
                joinPoint,
                result,
                oldValue,
                exception,
                request,
                duration
            );
        }

        return result;
    }

    /**
     * 异步记录审计日志
     */
    private void recordAuditLog(Long userId,
                                Long tenantId,
                                Auditable auditable,
                                ProceedingJoinPoint joinPoint,
                                Object returnValue,
                                Object oldValue,
                                Throwable exception,
                                HttpServletRequest request,
                                long duration) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setUserId(userId);
            // 如果tenantId为null，使用默认值1（默认商户/超级管理员商户）
            auditLog.setTenantId(tenantId != null ? tenantId : 1L);
            auditLog.setResource(auditable.resource());
            auditLog.setAction(auditable.action());
            auditLog.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));

            // 设置状态
            if (exception != null) {
                auditLog.setStatus(AuditLog.Status.FAILED.getValue());
                auditLog.setErrorMessage(exception.getMessage());
            } else {
                auditLog.setStatus(AuditLog.Status.SUCCESS.getValue());
            }

            // 提取资源ID
            Long resourceId = extractResourceId(joinPoint, returnValue, auditable.resourceIdParam());
            auditLog.setResourceId(resourceId);

            // 记录新值（返回值）
            if (returnValue != null && exception == null) {
                Object newValue = fetchNewValue(auditable.resource(), resourceId, returnValue);
                auditLog.setNewValue(serializeValue(newValue));
            }

            // 记录旧值
            if (oldValue != null) {
                auditLog.setOldValue(serializeValue(oldValue));
            }

            // 记录请求信息
            if (request != null) {
                auditLog.setIpAddress(getClientIp(request));
                auditLog.setUserAgent(request.getHeader("User-Agent"));
            }

            // 异步写入审计日志
            auditLogService.recordAuditAsync(auditLog);

            log.debug("Audit log recorded: resource={}, action={}, status={}, duration={}ms",
                    auditable.resource(), auditable.action(), auditLog.getStatus(), duration);

        } catch (Exception e) {
            // 审计日志失败不应影响主业务逻辑
            log.error("Failed to record audit log: resource={}, action={}, error={}",
                    auditable.resource(), auditable.action(), e.getMessage());
        }
    }

    /**
     * 获取新值（操作后的实际数据）
     */
    private Object fetchNewValue(String resource, Long resourceId, Object returnValue) {
        try {
            if (resourceId == null) {
                return returnValue;
            }

            if ("USER".equals(resource)) {
                // 获取用户新值
                UserService userService = applicationContext.getBean(UserService.class);
                Map<String, Object> userMap = userService.findById(resourceId)
                    .map(user -> {
                        Map<String, Object> map = new HashMap<String, Object>();
                        map.put("id", user.getId());
                        map.put("username", user.getUsername());
                        map.put("email", user.getEmail());
                        map.put("phone", user.getPhone());
                        map.put("status", user.getStatus());
                        return map;
                    })
                    .orElse(null);
                return userMap != null ? userMap : returnValue;
            } else if ("TENANT".equals(resource)) {
                // 获取商户新值
                TenantService tenantService = applicationContext.getBean(TenantService.class);
                Map<String, Object> tenantMap = tenantService.findById(resourceId)
                    .map(tenant -> {
                        Map<String, Object> map = new HashMap<String, Object>();
                        map.put("id", tenant.getId());
                        map.put("tenantCode", tenant.getTenantCode());
                        map.put("tenantName", tenant.getTenantName());
                        map.put("status", tenant.getStatus().toString());
                        return map;
                    })
                    .orElse(null);
                return tenantMap != null ? tenantMap : returnValue;
            } else if ("USER_ROLE".equals(resource)) {
                // 获取用户角色新值
                RoleService roleService = applicationContext.getBean(RoleService.class);
                List<Role> userRoles = roleService.getRolesByUserId(resourceId);
                Map<String, Object> rolesMap = new HashMap<>();
                rolesMap.put("userId", resourceId);
                rolesMap.put("roles", userRoles.stream()
                    .map(role -> {
                        Map<String, Object> roleMap = new HashMap<>();
                        roleMap.put("id", role.getId());
                        roleMap.put("roleName", role.getRoleName());
                        roleMap.put("displayName", role.getDisplayName());
                        return roleMap;
                    })
                    .collect(Collectors.toList()));
                return rolesMap;
            }

        } catch (Exception e) {
            log.warn("Failed to fetch new value for resource: {}, error: {}",
                resource, e.getMessage());
        }

        return returnValue;
    }

    /**
     * 获取旧值（用于UPDATE操作）
     * 这里需要根据实际业务逻辑实现
     */
    private Object fetchOldValue(ProceedingJoinPoint joinPoint, Auditable auditable) {
        try {
            // 提取资源ID
            Long resourceId = extractResourceId(joinPoint, null, auditable.resourceIdParam());
            if (resourceId == null) {
                return null;
            }

            // 根据资源类型获取旧值
            String resource = auditable.resource();

            if ("USER".equals(resource)) {
                // 获取用户旧值
                UserService userService = applicationContext.getBean(UserService.class);
                return userService.findById(resourceId)
                    .map(user -> {
                        Map<String, Object> userMap = new HashMap<>();
                        userMap.put("id", user.getId());
                        userMap.put("username", user.getUsername());
                        userMap.put("email", user.getEmail());
                        userMap.put("phone", user.getPhone());
                        userMap.put("status", user.getStatus());
                        return userMap;
                    })
                    .orElse(null);
            } else if ("TENANT".equals(resource)) {
                // 获取商户旧值
                TenantService tenantService = applicationContext.getBean(TenantService.class);
                return tenantService.findById(resourceId)
                    .map(tenant -> {
                        Map<String, Object> tenantMap = new HashMap<>();
                        tenantMap.put("id", tenant.getId());
                        tenantMap.put("tenantCode", tenant.getTenantCode());
                        tenantMap.put("tenantName", tenant.getTenantName());
                        tenantMap.put("status", tenant.getStatus().toString());
                        return tenantMap;
                    })
                    .orElse(null);
            } else if ("USER_ROLE".equals(resource)) {
                // 获取用户角色旧值
                RoleService roleService = applicationContext.getBean(RoleService.class);
                List<Role> userRoles = roleService.getRolesByUserId(resourceId);
                Map<String, Object> rolesMap = new HashMap<>();
                rolesMap.put("userId", resourceId);
                rolesMap.put("roles", userRoles.stream()
                    .map(role -> {
                        Map<String, Object> roleMap = new HashMap<>();
                        roleMap.put("id", role.getId());
                        roleMap.put("roleName", role.getRoleName());
                        roleMap.put("displayName", role.getDisplayName());
                        return roleMap;
                    })
                    .collect(Collectors.toList()));
                return rolesMap;
            }

        } catch (Exception e) {
            log.warn("Failed to fetch old value for resource: {}, error: {}",
                auditable.resource(), e.getMessage());
        }

        return null;
    }

    /**
     * 提取资源ID
     */
    private Long extractResourceId(ProceedingJoinPoint joinPoint, Object returnValue, String resourceIdParam) {
        try {
            // 1. 先尝试从方法参数中提取
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            String[] paramNames = signature.getParameterNames();
            Object[] args = joinPoint.getArgs();

            for (int i = 0; i < paramNames.length; i++) {
                if (resourceIdParam.equals(paramNames[i])) {
                    Object value = args[i];
                    if (value instanceof Long) {
                        return (Long) value;
                    } else if (value instanceof Number) {
                        return ((Number) value).longValue();
                    }
                }
            }

            // 2. 尝试从返回值中提取
            if (returnValue != null) {
                // 如果返回值是Map，尝试获取data中的id
                if (returnValue instanceof Map) {
                    Map<?, ?> map = (Map<?, ?>) returnValue;
                    Object data = map.get("data");
                    if (data instanceof Map) {
                        Object id = ((Map<?, ?>) data).get(resourceIdParam);
                        if (id instanceof Long) {
                            return (Long) id;
                        } else if (id instanceof Number) {
                            return ((Number) id).longValue();
                        }
                    }
                }

                // 尝试通过反射获取id字段
                try {
                    Field field = returnValue.getClass().getDeclaredField(resourceIdParam);
                    field.setAccessible(true);
                    Object value = field.get(returnValue);
                    if (value instanceof Long) {
                        return (Long) value;
                    } else if (value instanceof Number) {
                        return ((Number) value).longValue();
                    }
                } catch (NoSuchFieldException | IllegalAccessException e) {
                    // 忽略，继续尝试其他方式
                }
            }

        } catch (Exception e) {
            log.debug("Failed to extract resource ID: {}", e.getMessage());
        }

        return null;
    }

    /**
     * 序列化值为JSON字符串
     */
    private String serializeValue(Object value) {
        try {
            // 限制JSON大小，避免过大
            String json = objectMapper.writeValueAsString(value);
            if (json.length() > 10000) {
                return json.substring(0, 10000) + "... (truncated)";
            }
            return json;
        } catch (Exception e) {
            log.debug("Failed to serialize value: {}", e.getMessage());
            return value.toString();
        }
    }

    /**
     * 从请求头提取Token
     */
    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    /**
     * 获取客户端真实IP
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
