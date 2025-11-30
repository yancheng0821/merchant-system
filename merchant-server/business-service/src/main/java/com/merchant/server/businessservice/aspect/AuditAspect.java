package com.merchant.server.businessservice.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.server.businessservice.client.AuditClient;
import com.merchant.server.common.annotation.Auditable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.MDC;
import org.springframework.context.ApplicationContext;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import jakarta.servlet.http.HttpServletRequest;
import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * 审计切面
 * Audit Aspect for business-service
 *
 * Order = 1: 确保在@Transactional(默认order=Integer.MAX_VALUE)之前执行
 * 这样可以在事务开启前读取oldValue，避免读到事务中已修改的数据
 */
@Slf4j
@Aspect
@Order(1)
@Component
@RequiredArgsConstructor
public class AuditAspect {

    private final AuditClient auditClient;
    private final HttpServletRequest request;
    private final ApplicationContext applicationContext;
    private final ObjectMapper objectMapper;
    private final org.springframework.transaction.support.TransactionTemplate readOnlyTransactionTemplate;

    @Around("@annotation(com.merchant.server.common.annotation.Auditable)")
    public Object auditOperation(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        Auditable auditable = method.getAnnotation(Auditable.class);

        // 获取方法参数
        Object[] args = joinPoint.getArgs();
        Parameter[] parameters = method.getParameters();

        // 提取必要信息
        Long tenantId = extractTenantId(args, parameters);
        Long userId = extractUserId();
        Long resourceId = extractResourceId(auditable.resourceIdParam(), args, parameters);
        String traceId = MDC.get("traceId");

        // 记录旧值（如果需要）
        String oldValueJson = null;
        Object oldValue = null;
        if (auditable.recordOldValue()) {
            // STAFF_ATTENDANCE 特殊处理：通过 resourceId + date 查询
            if ("STAFF_ATTENDANCE".equals(auditable.resource())) {
                log.debug("About to get old value for STAFF_ATTENDANCE using resourceId + date");
                oldValue = getOldValueForStaffAttendance(args, parameters);
                if (oldValue != null) {
                    oldValueJson = serializeToJson(oldValue);
                    log.debug("Old value captured for STAFF_ATTENDANCE: {}", oldValueJson);
                    // 从旧值中提取 resourceId 和 tenantId
                    if (resourceId == null) {
                        resourceId = extractResourceIdFromObject(oldValue);
                    }
                    if (tenantId == null) {
                        tenantId = extractTenantIdFromObject(oldValue);
                    }
                } else {
                    log.debug("No existing STAFF_ATTENDANCE record found (new record will be created)");
                }
            } else if (resourceId != null) {
                // 其他资源类型：通过 resourceId 查询
                log.debug("About to get old value for resource={}, resourceId={}, action={}",
                    auditable.resource(), resourceId, auditable.action());
                oldValue = getOldValue(auditable.resource(), resourceId, tenantId);
                if (oldValue != null) {
                    oldValueJson = serializeToJson(oldValue);
                    log.debug("Old value captured: {}", oldValueJson);
                    // 如果tenantId为null，尝试从旧值中提取
                    if (tenantId == null) {
                        tenantId = extractTenantIdFromObject(oldValue);
                    }
                } else {
                    log.warn("Old value is null for resource={}, resourceId={}", auditable.resource(), resourceId);
                }
            }
        }

        // 执行方法
        Object result = null;
        String status = "SUCCESS";
        String errorMessage = null;
        String newValueJson = null;

        try {
            result = joinPoint.proceed();

            // 如果资源ID为null，尝试从结果中提取（通常用于CREATE操作）
            if (resourceId == null) {
                resourceId = extractResourceIdFromResult(result);
            }

            // 如果tenantId为null，尝试从结果中提取
            if (tenantId == null) {
                tenantId = extractTenantIdFromResult(result);
            }

            // 如果tenantId仍然为null，尝试通过resourceId查询获取
            if (tenantId == null && resourceId != null) {
                tenantId = extractTenantIdFromResource(auditable.resource(), resourceId);
            }

            // 记录新值（对于CREATE/UPDATE/PURCHASE/UPDATE_STATUS操作）
            if ("CREATE".equals(auditable.action()) ||
                "PURCHASE".equals(auditable.action()) ||
                "UPDATE".equals(auditable.action()) ||
                "UPDATE_STATUS".equals(auditable.action())) {
                Object newValue = extractBodyFromResult(result);
                if (newValue != null) {
                    newValueJson = serializeToJson(newValue);
                    log.debug("New value captured from result: {}", newValueJson);
                } else {
                    log.warn("New value is null after extracting from result");
                }
            }
            // 对于DELETE操作，由于已删除，newValue为null或空对象即可
            // 不需要重新查询

        } catch (Exception e) {
            status = "FAILED";
            errorMessage = e.getMessage();
            log.error("Audit operation failed: {}.{}",
                signature.getDeclaringTypeName(), signature.getName(), e);
            throw e;
        } finally {
            // 异步记录审计日志
            recordAuditAsync(
                tenantId,
                userId,
                auditable.resource(),
                auditable.action(),
                resourceId,
                status,
                errorMessage,
                auditable.description(),
                oldValueJson,
                newValueJson,
                traceId
            );
        }

        return result;
    }

    @Async("auditExecutor")
    protected void recordAuditAsync(Long tenantId, Long userId, String resource, String action,
                                     Long resourceId, String status, String errorMessage,
                                     String description, String oldValue, String newValue, String traceId) {
        try {
            Map<String, Object> auditLog = new HashMap<>();
            auditLog.put("tenantId", tenantId);
            auditLog.put("userId", userId);
            auditLog.put("resource", resource);
            auditLog.put("action", action);
            auditLog.put("resourceId", resourceId);
            auditLog.put("status", status);
            auditLog.put("errorMessage", errorMessage);
            auditLog.put("description", description);
            auditLog.put("ipAddress", getClientIp());
            auditLog.put("userAgent", request.getHeader("User-Agent"));
            auditLog.put("traceId", traceId);
            // createdAt will be set by auth-service

            if (oldValue != null) {
                auditLog.put("oldValue", oldValue);
            }

            if (newValue != null) {
                auditLog.put("newValue", newValue);
            }

            // 调用 auth-service 的内部 API 创建审计日志
            auditClient.createAuditLog(auditLog);

            log.debug("Audit log recorded: resource={}, action={}, resourceId={}, status={}, traceId={}",
                resource, action, resourceId, status, traceId);

        } catch (Exception e) {
            log.error("Failed to record audit log asynchronously", e);
        }
    }

    private Long extractTenantId(Object[] args, Parameter[] parameters) {
        for (int i = 0; i < parameters.length; i++) {
            Parameter param = parameters[i];

            // 检查 @RequestParam 注解
            RequestParam requestParam = param.getAnnotation(RequestParam.class);
            if (requestParam != null && "tenantId".equals(requestParam.value())) {
                return (Long) args[i];
            }

            // 检查参数名
            if ("tenantId".equals(param.getName()) && args[i] instanceof Long) {
                return (Long) args[i];
            }

            // 检查 @RequestBody 中的 tenantId
            if (param.getAnnotation(RequestBody.class) != null && args[i] != null) {
                // 如果是 Map 类型，直接从 Map 中获取
                if (args[i] instanceof Map) {
                    Map<?, ?> map = (Map<?, ?>) args[i];
                    Object tenantId = map.get("tenantId");
                    if (tenantId instanceof Number) {
                        return ((Number) tenantId).longValue();
                    }
                } else {
                    // 否则通过反射调用 getTenantId 方法
                    try {
                        Method getTenantId = args[i].getClass().getMethod("getTenantId");
                        Object tenantId = getTenantId.invoke(args[i]);
                        if (tenantId instanceof Long) {
                            return (Long) tenantId;
                        }
                    } catch (Exception ignored) {
                        // Ignore if getTenantId method doesn't exist
                    }
                }
            }
        }

        // 尝试从请求参数中获取
        String tenantIdStr = request.getParameter("tenantId");
        if (tenantIdStr != null) {
            try {
                return Long.parseLong(tenantIdStr);
            } catch (NumberFormatException ignored) {
            }
        }

        return null;
    }

    /**
     * 通过resourceId获取tenantId
     * 用于某些情况下参数中没有tenantId，但可以通过resourceId查询得到
     */
    private Long extractTenantIdFromResource(String resourceType, Long resourceId) {
        if (resourceId == null) {
            return null;
        }

        try {
            switch (resourceType) {
                case "RESOURCE_SCHEDULE":
                case "RESOURCE":
                case "STAFF_NOTIFICATION":
                    // 通过Resource实体获取tenantId
                    // STAFF_NOTIFICATION 的 resourceId 就是 staffId，也是一个 Resource
                    Object resourceService = applicationContext.getBean("resourceServiceImpl");
                    Method getResourceById = resourceService.getClass().getMethod("getResourceById", Long.class);
                    Object resource = getResourceById.invoke(resourceService, resourceId);
                    if (resource != null) {
                        Method getTenantId = resource.getClass().getMethod("getTenantId");
                        Object tenantId = getTenantId.invoke(resource);
                        if (tenantId instanceof Long) {
                            return (Long) tenantId;
                        }
                    }
                    break;
                default:
                    break;
            }
        } catch (Exception e) {
            log.warn("Failed to extract tenantId from resource: resourceType={}, resourceId={}", resourceType, resourceId, e);
        }

        return null;
    }

    private Long extractUserId() {
        // 从请求头中提取用户ID
        String userIdHeader = request.getHeader("X-User-Id");
        if (userIdHeader != null) {
            try {
                return Long.parseLong(userIdHeader);
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }

    private Long extractResourceId(String resourceIdParam, Object[] args, Parameter[] parameters) {
        if (resourceIdParam == null || resourceIdParam.isEmpty()) {
            return null;
        }

        for (int i = 0; i < parameters.length; i++) {
            Parameter param = parameters[i];

            // 检查 @PathVariable 注解
            PathVariable pathVariable = param.getAnnotation(PathVariable.class);
            if (pathVariable != null) {
                String pathVarName = pathVariable.value().isEmpty() ? param.getName() : pathVariable.value();
                if (resourceIdParam.equals(pathVarName) && args[i] instanceof Long) {
                    return (Long) args[i];
                }
            }

            // 检查 @RequestParam 注解
            RequestParam requestParam = param.getAnnotation(RequestParam.class);
            if (requestParam != null) {
                String requestParamName = requestParam.value().isEmpty() ? param.getName() : requestParam.value();
                if (resourceIdParam.equals(requestParamName) && args[i] instanceof Long) {
                    return (Long) args[i];
                }
            }

            // 检查 @RequestBody 中的字段
            if (param.getAnnotation(RequestBody.class) != null && args[i] != null) {
                try {
                    // 尝试通过反射调用 getter 方法
                    String getterName = "get" + resourceIdParam.substring(0, 1).toUpperCase() + resourceIdParam.substring(1);
                    Method getter = args[i].getClass().getMethod(getterName);
                    Object value = getter.invoke(args[i]);
                    if (value instanceof Long) {
                        return (Long) value;
                    }
                } catch (Exception ignored) {
                    // Ignore if getter method doesn't exist
                }
            }
        }

        // 如果上述方法都没找到，尝试从参数名直接匹配（例如：Long id）
        for (int i = 0; i < parameters.length; i++) {
            Parameter param = parameters[i];
            // 检查参数名是否与resourceIdParam匹配
            if (resourceIdParam.equals(param.getName()) && args[i] instanceof Long) {
                return (Long) args[i];
            }
        }

        // 最后尝试从普通对象参数中提取（Service层常见情况）
        for (int i = 0; i < parameters.length; i++) {
            if (args[i] != null && !isPrimitiveOrWrapper(args[i])) {
                try {
                    // 尝试通过反射调用 getter 方法
                    String getterName = "get" + resourceIdParam.substring(0, 1).toUpperCase() + resourceIdParam.substring(1);
                    Method getter = args[i].getClass().getMethod(getterName);
                    Object value = getter.invoke(args[i]);
                    if (value instanceof Long) {
                        return (Long) value;
                    }
                } catch (Exception ignored) {
                    // Ignore if getter method doesn't exist
                }
            }
        }

        return null;
    }

    private Long extractResourceIdFromResult(Object result) {
        if (result == null) {
            return null;
        }

        Object actualResult = result;

        // 如果返回的是ResponseEntity，提取body
        if (result instanceof org.springframework.http.ResponseEntity) {
            org.springframework.http.ResponseEntity<?> responseEntity =
                (org.springframework.http.ResponseEntity<?>) result;
            actualResult = responseEntity.getBody();
            if (actualResult == null) {
                return null;
            }
        }

        try {
            Method getId = actualResult.getClass().getMethod("getId");
            Object id = getId.invoke(actualResult);
            if (id instanceof Long) {
                return (Long) id;
            }
        } catch (Exception ignored) {
            // Ignore if getId method doesn't exist
        }

        return null;
    }

    private Long extractTenantIdFromResult(Object result) {
        if (result == null) {
            return null;
        }

        Object actualResult = result;

        // 如果返回的是ResponseEntity，提取body
        if (result instanceof org.springframework.http.ResponseEntity) {
            org.springframework.http.ResponseEntity<?> responseEntity =
                (org.springframework.http.ResponseEntity<?>) result;
            actualResult = responseEntity.getBody();
            if (actualResult == null) {
                return null;
            }
        }

        try {
            Method getTenantId = actualResult.getClass().getMethod("getTenantId");
            Object tenantId = getTenantId.invoke(actualResult);
            if (tenantId instanceof Long) {
                return (Long) tenantId;
            }
        } catch (Exception ignored) {
            // Ignore if getTenantId method doesn't exist
        }

        return null;
    }

    /**
     * 从任意对象中提取tenantId（用于从旧值中提取）
     */
    private Long extractTenantIdFromObject(Object obj) {
        if (obj == null) {
            return null;
        }

        try {
            Method getTenantId = obj.getClass().getMethod("getTenantId");
            Object tenantId = getTenantId.invoke(obj);
            if (tenantId instanceof Long) {
                return (Long) tenantId;
            } else if (tenantId instanceof Integer) {
                return ((Integer) tenantId).longValue();
            }
        } catch (Exception ignored) {
            // Ignore if getTenantId method doesn't exist
        }

        return null;
    }

    /**
     * 从任意对象中提取resourceId（用于从旧值中提取）
     */
    private Long extractResourceIdFromObject(Object obj) {
        if (obj == null) {
            return null;
        }

        try {
            Method getResourceId = obj.getClass().getMethod("getResourceId");
            Object resourceId = getResourceId.invoke(obj);
            if (resourceId instanceof Long) {
                return (Long) resourceId;
            } else if (resourceId instanceof Integer) {
                return ((Integer) resourceId).longValue();
            }
        } catch (Exception ignored) {
            // Ignore if getResourceId method doesn't exist
        }

        // 也尝试 getId
        try {
            Method getId = obj.getClass().getMethod("getId");
            Object id = getId.invoke(obj);
            if (id instanceof Long) {
                return (Long) id;
            } else if (id instanceof Integer) {
                return ((Integer) id).longValue();
            }
        } catch (Exception ignored) {
            // Ignore if getId method doesn't exist
        }

        return null;
    }

    /**
     * 获取 STAFF_ATTENDANCE 的旧值（通过 resourceId + attendanceDate 查询）
     */
    private Object getOldValueForStaffAttendance(Object[] args, Parameter[] parameters) {
        return readOnlyTransactionTemplate.execute(status -> {
            try {
                // 从 @RequestBody 中提取 StaffAttendance 对象
                for (int i = 0; i < parameters.length; i++) {
                    if (parameters[i].getAnnotation(RequestBody.class) != null && args[i] != null) {
                        Object staffAttendance = args[i];

                        // 提取 resourceId
                        Method getResourceId = staffAttendance.getClass().getMethod("getResourceId");
                        Object resourceIdObj = getResourceId.invoke(staffAttendance);
                        Long resourceId = resourceIdObj instanceof Long ? (Long) resourceIdObj : null;

                        // 提取 attendanceDate
                        Method getAttendanceDate = staffAttendance.getClass().getMethod("getAttendanceDate");
                        Object attendanceDate = getAttendanceDate.invoke(staffAttendance);

                        if (resourceId != null && attendanceDate != null) {
                            // 调用 StaffAttendanceService 查询
                            Object staffAttendanceService = applicationContext.getBean("staffAttendanceService");
                            Method getByResourceIdAndDate = staffAttendanceService.getClass()
                                .getMethod("getByResourceIdAndDate", Long.class, java.time.LocalDate.class);
                            return getByResourceIdAndDate.invoke(staffAttendanceService, resourceId, attendanceDate);
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to get old value for STAFF_ATTENDANCE", e);
            }
            return null;
        });
    }

    /**
     * 获取旧值
     * 使用REQUIRES_NEW事务传播级别，确保在独立事务中读取，不受当前事务的修改影响
     */
    private Object getOldValue(String resource, Long resourceId, Long tenantId) {
        // 在独立的只读事务中执行查询，避免读到当前事务中已修改的数据
        return readOnlyTransactionTemplate.execute(status -> {
            try {
                // 根据resource类型获取对应的Service并查询
                if ("APPOINTMENT".equals(resource)) {
                    // 获取AppointmentService
                    Object appointmentService = applicationContext.getBean("appointmentServiceImpl");
                    Method getById = appointmentService.getClass().getMethod("getAppointmentById", Long.class);
                    return getById.invoke(appointmentService, resourceId);
                } else if ("CUSTOMER".equals(resource)) {
                    // 获取CustomerService
                    Object customerService = applicationContext.getBean("customerServiceImpl");
                    Method getById = customerService.getClass().getMethod("getCustomerById", Long.class);
                    return getById.invoke(customerService, resourceId);
                } else if ("SERVICE".equals(resource)) {
                    // 获取ServiceManagementService
                    Object serviceManagementService = applicationContext.getBean("serviceManagementServiceImpl");
                    Method getById = serviceManagementService.getClass().getMethod("getServiceById", Long.class);
                    return getById.invoke(serviceManagementService, resourceId);
                } else if ("SERVICE_PACKAGE".equals(resource)) {
                    // 获取ServicePackageService - 需要 tenantId 参数
                    Object servicePackageService = applicationContext.getBean("servicePackageService");
                    Method getById = servicePackageService.getClass().getMethod("getPackageById", Long.class, Long.class);
                    return getById.invoke(servicePackageService, resourceId, tenantId);
                } else if ("SERVICE_CATEGORY".equals(resource)) {
                    // 获取ServiceCategoryService
                    Object serviceCategoryService = applicationContext.getBean("serviceCategoryServiceImpl");
                    Method getById = serviceCategoryService.getClass().getMethod("getCategoryById", Long.class);
                    return getById.invoke(serviceCategoryService, resourceId);
                } else if ("RESOURCE".equals(resource)) {
                    // 获取ResourceService
                    Object resourceService = applicationContext.getBean("resourceServiceImpl");
                    Method getById = resourceService.getClass().getMethod("getResourceById", Long.class);
                    return getById.invoke(resourceService, resourceId);
                } else if ("RESOURCE_SCHEDULE".equals(resource)) {
                    // 获取ResourceService - 获取排班信息
                    Object resourceService = applicationContext.getBean("resourceServiceImpl");
                    Method getWeekAvailability = resourceService.getClass().getMethod("getWeekAvailability", Long.class);
                    return getWeekAvailability.invoke(resourceService, resourceId);
                } else if ("MEMBERSHIP_TIER".equals(resource)) {
                    // 获取MembershipTierService
                    Object membershipTierService = applicationContext.getBean("membershipTierServiceImpl");
                    Method getById = membershipTierService.getClass().getMethod("getById", Long.class);
                    return getById.invoke(membershipTierService, resourceId);
                } else if ("COST_MANAGEMENT".equals(resource)) {
                    // 获取CostManagementService - 根据请求URI确定具体类型
                    Object costManagementService = applicationContext.getBean("costManagementServiceImpl");
                    String requestUri = request.getRequestURI();
                    Method getById;

                    if (requestUri.contains("/certificates/")) {
                        getById = costManagementService.getClass().getMethod("getCertificateById", Long.class);
                    } else if (requestUri.contains("/fixed-costs/")) {
                        getById = costManagementService.getClass().getMethod("getFixedCostById", Long.class);
                    } else if (requestUri.contains("/materials/")) {
                        getById = costManagementService.getClass().getMethod("getMaterialPurchaseById", Long.class);
                    } else {
                        log.warn("Unknown cost management resource type from URI: {}", requestUri);
                        return null;
                    }

                    return getById.invoke(costManagementService, resourceId);
                } else if ("ORDER".equals(resource)) {
                    // 获取OrderService
                    Object orderService = applicationContext.getBean("orderServiceImpl");
                    Method getById = orderService.getClass().getMethod("getOrderById", Long.class);
                    return getById.invoke(orderService, resourceId);
                } else if ("MERCHANT_SETTINGS".equals(resource)) {
                    // 获取OnlineBookingConfig - 通过tenantId获取
                    Object onlineBookingConfigMapper = applicationContext.getBean("onlineBookingConfigMapper");
                    Method findByTenantId = onlineBookingConfigMapper.getClass().getMethod("findByTenantId", Long.class);
                    // 对于MERCHANT_SETTINGS，resourceId实际上是tenantId
                    return findByTenantId.invoke(onlineBookingConfigMapper, tenantId != null ? tenantId : resourceId);
                }
                // STAFF_ATTENDANCE 由 getOldValueForStaffAttendance 专门处理
                // 可以添加其他资源类型的处理
            } catch (Exception e) {
                log.warn("Failed to get old value for resource: {}, id: {}", resource, resourceId, e);
            }
            return null;
        });
    }

    /**
     * 序列化对象为JSON字符串 - 只包含核心字段
     */
    private String serializeToJson(Object obj) {
        try {
            // 对于复杂的嵌套对象，使用特殊处理
            Map<String, Object> coreFields = extractCoreFieldsForAudit(obj);
            return objectMapper.writeValueAsString(coreFields);
        } catch (Exception e) {
            log.warn("Failed to serialize object to JSON", e);
            return obj.toString();
        }
    }

    /**
     * 为审计日志提取核心字段 - 支持复杂嵌套结构
     */
    private Map<String, Object> extractCoreFieldsForAudit(Object obj) {
        if (obj == null) {
            return new HashMap<>();
        }

        try {
            String className = obj.getClass().getSimpleName();

            // 特殊处理 WeekAvailabilityDTO (排班数据)
            if ("WeekAvailabilityDTO".equals(className) || className.contains("WeekAvailability")) {
                return extractWeekAvailabilityFields(obj);
            }

            // 其他对象使用默认处理
            return extractCoreFields(obj);
        } catch (Exception e) {
            log.warn("Failed to extract core fields for audit", e);
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("data", obj.toString());
            return fallback;
        }
    }

    /**
     * 提取排班数据的核心字段 - 只保留时间段信息
     */
    private Map<String, Object> extractWeekAvailabilityFields(Object obj) {
        Map<String, Object> result = new HashMap<>();
        try {
            Class<?> clazz = obj.getClass();

            // 提取基本信息
            try {
                Method getResourceId = clazz.getMethod("getResourceId");
                Object resourceId = getResourceId.invoke(obj);
                if (resourceId != null) {
                    result.put("resourceId", resourceId);
                }
            } catch (Exception ignored) {}

            try {
                Method getResourceName = clazz.getMethod("getResourceName");
                Object resourceName = getResourceName.invoke(obj);
                if (resourceName != null) {
                    result.put("resourceName", resourceName);
                }
            } catch (Exception ignored) {}

            // 提取weekDays数据
            try {
                Method getWeekDays = clazz.getMethod("getWeekDays");
                Object weekDays = getWeekDays.invoke(obj);
                if (weekDays instanceof java.util.List) {
                    java.util.List<?> days = (java.util.List<?>) weekDays;
                    for (Object day : days) {
                        String dayName = null;
                        java.util.List<String> timeSlots = new java.util.ArrayList<>();

                        // 获取dayName
                        try {
                            Method getDayName = day.getClass().getMethod("getDayName");
                            dayName = (String) getDayName.invoke(day);
                        } catch (Exception ignored) {}

                        // 获取segments
                        try {
                            Method getSegments = day.getClass().getMethod("getSegments");
                            Object segments = getSegments.invoke(day);
                            if (segments instanceof java.util.List) {
                                java.util.List<?> segList = (java.util.List<?>) segments;
                                for (Object seg : segList) {
                                    try {
                                        Method getStartTime = seg.getClass().getMethod("getStartTime");
                                        Method getEndTime = seg.getClass().getMethod("getEndTime");
                                        String startTime = (String) getStartTime.invoke(seg);
                                        String endTime = (String) getEndTime.invoke(seg);
                                        if (startTime != null && endTime != null) {
                                            timeSlots.add(startTime + "-" + endTime);
                                        }
                                    } catch (Exception ignored) {}
                                }
                            }
                        } catch (Exception ignored) {}

                        // 只记录有排班的天
                        if (dayName != null && !timeSlots.isEmpty()) {
                            result.put(dayName, String.join(", ", timeSlots));
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to extract weekDays from schedule", e);
            }

            return result;
        } catch (Exception e) {
            log.warn("Failed to extract week availability fields", e);
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("data", obj.toString());
            return fallback;
        }
    }

    /**
     * 提取对象的核心字段
     */
    private Map<String, Object> extractCoreFields(Object obj) {
        Map<String, Object> coreFields = new HashMap<>();
        if (obj == null) {
            return coreFields;
        }

        try {
            // 定义核心字段列表（根据不同资源类型）
            String[] importantFields = {
                // 通用字段
                "id", "status", "notes",
                // 预约相关
                "appointmentDate", "appointmentTime", "duration",
                // 支付相关
                "totalAmount", "paid", "paymentMethod", "tipPaymentMethod", "paymentStatus",
                // 订单相关
                "orderStatus", "paymentDate", "tipAmount",
                // 用户相关
                "username", "email", "phone", "enabled",
                // 角色权限
                "name", "description", "code",
                // 客户相关
                "firstName", "lastName", "address", "dateOfBirth", "gender",
                "membershipLevel", "points", "totalSpent", "allergies",
                "communicationPreference", "lastVisitDate", "fullName",
                // 客户套餐相关
                "customerId", "packageId", "packageName", "packageDescription",
                "purchaseDate", "expirationDate", "purchasePrice", "isGift",
                "giftedByCustomerId", "daysRemaining",
                // 服务相关
                "categoryId", "categoryName", "price", "resourceType",
                // 服务套餐相关
                "originalPrice", "packagePrice", "discountPercentage",
                "validityDays", "maxSharedUsers", "terms",
                // 服务分类相关
                "icon", "color", "sortOrder", "serviceCount",
                // 资源（员工/房间）相关
                "type", "capacity", "location", "equipment", "specialties",
                "hourlyRate", "position", "startDate", "avatar",
                // 员工签到签退相关
                "resourceId", "attendanceDate", "checkInTime", "checkOutTime",
                "summarySent", "summarySentAt", "summarySentBy",
                // 会员等级相关
                "requiredPoints", "discountRate", "benefits", "isActive", "isDeleted",
                // 成本管理 - 证书相关
                "certificateName", "certificateType", "certificateNumber", "issueDate",
                "expiryDate", "issuingAuthority", "renewalFee", "attachmentUrl",
                // 成本管理 - 固定成本相关
                "costType", "costName", "amount", "billingCycle", "paymentDate",
                "startDate", "endDate", "vendor", "paymentMethod",
                // 成本管理 - 物料采购相关
                "materialName", "materialCategory", "quantity", "unit", "unitPrice",
                "totalAmount", "supplier", "purchaseDate",
                // 在线预约设置相关
                "enabled", "bookingPageSlug", "advanceBookingDays", "minAdvanceHours",
                "allowCustomerCancel", "cancelDeadlineHours", "allowCustomerReschedule",
                "rescheduleDeadlineHours", "requireConfirmation", "welcomeMessage",
                "cancellationPolicy", "googleBusinessEnabled", "googlePlaceId"
            };

            Class<?> clazz = obj.getClass();
            for (String fieldName : importantFields) {
                try {
                    // 尝试调用 getter 方法
                    String getterName = "get" + fieldName.substring(0, 1).toUpperCase() + fieldName.substring(1);
                    Method getter = clazz.getMethod(getterName);
                    Object value = getter.invoke(obj);
                    if (value != null) {
                        coreFields.put(fieldName, value);
                    }
                } catch (NoSuchMethodException ignored) {
                    // 字段不存在，忽略
                }
            }

            // 如果没有提取到任何字段，返回完整对象的字符串表示
            if (coreFields.isEmpty()) {
                coreFields.put("data", obj.toString());
            }

        } catch (Exception e) {
            log.warn("Failed to extract core fields from object", e);
            coreFields.put("data", obj.toString());
        }

        return coreFields;
    }

    /**
     * 从结果中提取实际对象（处理ResponseEntity和Map）
     */
    private Object extractBodyFromResult(Object result) {
        if (result == null) {
            return null;
        }

        Object actualResult = result;

        // 如果返回的是ResponseEntity，提取body
        if (result instanceof org.springframework.http.ResponseEntity) {
            org.springframework.http.ResponseEntity<?> responseEntity =
                (org.springframework.http.ResponseEntity<?>) result;
            actualResult = responseEntity.getBody();
            if (actualResult == null) {
                return null;
            }
        }

        // 如果返回的是Map，尝试提取业务对象
        if (actualResult instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) actualResult;

            // 常见的业务对象键名
            String[] businessKeys = {"package", "data", "customer", "appointment", "order", "payment", "result"};

            for (String key : businessKeys) {
                Object businessObject = map.get(key);
                if (businessObject != null && !isPrimitiveOrWrapper(businessObject)) {
                    return businessObject;
                }
            }
        }

        return actualResult;
    }

    /**
     * 判断对象是否为基本类型或包装类
     */
    private boolean isPrimitiveOrWrapper(Object obj) {
        if (obj == null) {
            return false;
        }
        Class<?> clazz = obj.getClass();
        return clazz.isPrimitive()
            || clazz == String.class
            || clazz == Boolean.class
            || clazz == Integer.class
            || clazz == Long.class
            || clazz == Double.class
            || clazz == Float.class
            || clazz == Short.class
            || clazz == Byte.class
            || clazz == Character.class;
    }

    private String getClientIp() {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // 取第一个IP
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
