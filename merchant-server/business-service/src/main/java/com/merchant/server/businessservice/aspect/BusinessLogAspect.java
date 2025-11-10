package com.merchant.server.businessservice.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.HashMap;
import java.util.Map;

/**
 * 业务日志切面
 * 自动记录所有 Controller 方法的请求和响应
 */
@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class BusinessLogAspect {

    private final ObjectMapper objectMapper;

    /**
     * 拦截所有 Controller 方法
     */
    @Around("execution(* com.merchant.server.businessservice.controller..*(..))")
    public Object logControllerMethod(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();

        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = method.getName();
        String fullMethodName = className + "." + methodName;

        // 提取关键参数（避免打印完整对象）
        Map<String, Object> keyParams = extractKeyParameters(joinPoint, method);

        // [REQUEST] 记录请求
        log.info("[REQUEST] {} - {}", fullMethodName, formatParams(keyParams));

        Object result = null;
        boolean success = false;
        String errorMessage = null;

        try {
            // 执行实际方法
            result = joinPoint.proceed();
            success = true;
            return result;
        } catch (Exception e) {
            errorMessage = e.getClass().getSimpleName() + ": " + e.getMessage();
            throw e;
        } finally {
            long duration = System.currentTimeMillis() - startTime;

            // [RESPONSE] 记录响应
            if (success) {
                String resultSummary = extractResultSummary(result);
                log.info("[RESPONSE] {} - success: true, duration: {}ms, result: {}",
                    fullMethodName, duration, resultSummary);
            } else {
                log.error("[RESPONSE] {} - success: false, duration: {}ms, error: {}",
                    fullMethodName, duration, errorMessage);
            }
        }
    }

    /**
     * 提取方法参数中的关键字段
     * 避免打印完整对象，只提取关键ID和字段
     */
    private Map<String, Object> extractKeyParameters(ProceedingJoinPoint joinPoint, Method method) {
        Map<String, Object> keyParams = new HashMap<>();
        Object[] args = joinPoint.getArgs();
        Parameter[] parameters = method.getParameters();

        for (int i = 0; i < parameters.length && i < args.length; i++) {
            Object arg = args[i];
            if (arg == null) {
                continue;
            }

            String paramName = parameters[i].getName();

            // 跳过 Spring 内部参数
            if (isSpringInternalParameter(parameters[i])) {
                continue;
            }

            // 基本类型和字符串直接记录
            if (isPrimitiveOrWrapper(arg.getClass()) || arg instanceof String) {
                keyParams.put(paramName, arg);
            }
            // 对于复杂对象，尝试提取关键字段
            else {
                Map<String, Object> extracted = extractKeyFields(arg);
                if (!extracted.isEmpty()) {
                    keyParams.put(paramName, extracted);
                }
            }
        }

        return keyParams;
    }

    /**
     * 从对象中提取关键字段（ID、名称等）
     */
    private Map<String, Object> extractKeyFields(Object obj) {
        Map<String, Object> keyFields = new HashMap<>();

        try {
            Class<?> clazz = obj.getClass();

            // 提取常见的关键字段
            String[] keyFieldNames = {"id", "tenantId", "customerId", "appointmentId",
                "serviceId", "resourceId", "orderId", "status", "amount", "totalAmount",
                "date", "startTime", "endTime", "name", "email", "phone"};

            for (String fieldName : keyFieldNames) {
                try {
                    // 尝试 getXxx() 方法
                    String getterName = "get" + Character.toUpperCase(fieldName.charAt(0)) + fieldName.substring(1);
                    Method getter = clazz.getMethod(getterName);
                    Object value = getter.invoke(obj);
                    if (value != null) {
                        keyFields.put(fieldName, value);
                    }
                } catch (Exception e) {
                    // 字段不存在，忽略
                }
            }
        } catch (Exception e) {
            log.debug("Failed to extract key fields from {}: {}", obj.getClass().getSimpleName(), e.getMessage());
        }

        return keyFields;
    }

    /**
     * 提取返回结果的摘要信息
     */
    private String extractResultSummary(Object result) {
        if (result == null) {
            return "null";
        }

        try {
            // ApiResponse 类型
            if (result.getClass().getSimpleName().equals("ApiResponse")) {
                Map<String, Object> summary = new HashMap<>();

                try {
                    Method isSuccessMethod = result.getClass().getMethod("isSuccess");
                    Object success = isSuccessMethod.invoke(result);
                    summary.put("success", success);
                } catch (Exception e) {
                    // ignore
                }

                try {
                    Method getMessageMethod = result.getClass().getMethod("getMessage");
                    Object message = getMessageMethod.invoke(result);
                    if (message != null) {
                        summary.put("message", message);
                    }
                } catch (Exception e) {
                    // ignore
                }

                try {
                    Method getDataMethod = result.getClass().getMethod("getData");
                    Object data = getDataMethod.invoke(result);
                    if (data != null) {
                        Map<String, Object> dataSummary = extractKeyFields(data);
                        if (!dataSummary.isEmpty()) {
                            summary.put("data", dataSummary);
                        } else {
                            summary.put("dataType", data.getClass().getSimpleName());
                        }
                    }
                } catch (Exception e) {
                    // ignore
                }

                return formatParams(summary);
            }

            // 基本类型或字符串
            if (isPrimitiveOrWrapper(result.getClass()) || result instanceof String) {
                return String.valueOf(result);
            }

            // 其他对象，提取关键字段
            Map<String, Object> keyFields = extractKeyFields(result);
            if (!keyFields.isEmpty()) {
                return formatParams(keyFields);
            }

            return result.getClass().getSimpleName();

        } catch (Exception e) {
            return result.getClass().getSimpleName();
        }
    }

    /**
     * 格式化参数为字符串
     */
    private String formatParams(Map<String, Object> params) {
        if (params.isEmpty()) {
            return "{}";
        }

        StringBuilder sb = new StringBuilder();
        params.forEach((key, value) -> {
            if (sb.length() > 0) {
                sb.append(", ");
            }
            sb.append(key).append(": ");

            if (value instanceof Map) {
                sb.append(formatParams((Map<String, Object>) value));
            } else {
                sb.append(value);
            }
        });

        return sb.toString();
    }

    /**
     * 判断是否为基本类型或包装类
     */
    private boolean isPrimitiveOrWrapper(Class<?> type) {
        return type.isPrimitive() ||
            type == Boolean.class ||
            type == Character.class ||
            type == Byte.class ||
            type == Short.class ||
            type == Integer.class ||
            type == Long.class ||
            type == Float.class ||
            type == Double.class;
    }

    /**
     * 判断是否为 Spring 内部参数
     */
    private boolean isSpringInternalParameter(Parameter parameter) {
        Class<?> type = parameter.getType();
        return type.getName().startsWith("javax.servlet") ||
               type.getName().startsWith("org.springframework.web") ||
               type.getName().startsWith("org.springframework.http");
    }
}
