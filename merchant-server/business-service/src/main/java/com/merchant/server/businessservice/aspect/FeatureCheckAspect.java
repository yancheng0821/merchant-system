package com.merchant.server.businessservice.aspect;

import com.merchant.server.businessservice.client.MerchantServiceClient;
import com.merchant.server.common.annotation.RequiresFeature;
import com.merchant.server.common.dto.ApiResponse;
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
 * 订阅功能检查AOP拦截器
 * 用于在API调用前检查租户是否有对应的订阅功能权限
 */
@Slf4j
@Aspect
@Component
public class FeatureCheckAspect {

    private final MerchantServiceClient merchantServiceClient;

    public FeatureCheckAspect(MerchantServiceClient merchantServiceClient) {
        this.merchantServiceClient = merchantServiceClient;
    }

    /**
     * 拦截 @RequiresFeature 注解
     */
    @Around("@annotation(com.merchant.server.common.annotation.RequiresFeature) || " +
            "@within(com.merchant.server.common.annotation.RequiresFeature)")
    public Object checkFeature(ProceedingJoinPoint joinPoint) throws Throwable {
        // 获取方法签名
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();

        // 获取注解
        RequiresFeature annotation = method.getAnnotation(RequiresFeature.class);
        if (annotation == null) {
            annotation = method.getDeclaringClass().getAnnotation(RequiresFeature.class);
        }

        if (annotation == null) {
            return joinPoint.proceed();
        }

        // 从请求中获取租户ID
        HttpServletRequest request = getCurrentRequest();
        if (request == null) {
            log.warn("Cannot get current request for feature check");
            return joinPoint.proceed(); // 如果无法获取请求，跳过检查
        }

        // 从Gateway传递的Header中获取租户ID
        String tenantIdHeader = request.getHeader("X-Tenant-Id");

        if (tenantIdHeader == null || tenantIdHeader.isEmpty()) {
            log.warn("Tenant ID not found in request header, skipping feature check");
            return joinPoint.proceed(); // 如果没有租户ID，跳过检查
        }

        Long tenantId;
        try {
            tenantId = Long.parseLong(tenantIdHeader);
        } catch (NumberFormatException e) {
            log.warn("Invalid tenant ID in header: {}", tenantIdHeader);
            return joinPoint.proceed();
        }

        // 获取需要检查的功能
        String feature = annotation.value();

        log.debug("Checking feature: tenant={}, feature={}", tenantId, feature);

        try {
            // 调用merchant-service检查功能
            ApiResponse<Boolean> response = merchantServiceClient.checkTenantFeature(tenantId, feature);

            if (response == null || !response.isSuccess()) {
                log.warn("Failed to check feature: tenant={}, feature={}", tenantId, feature);
                // 检查失败时，默认允许通过（fail-open策略，避免影响正常业务）
                return joinPoint.proceed();
            }

            Boolean hasFeature = response.getData();
            if (hasFeature == null || !hasFeature) {
                log.warn("Feature not available: tenant={}, feature={}", tenantId, feature);
                throw new FeatureNotAvailableException(annotation.message(), feature);
            }

            log.debug("Feature check passed: tenant={}, feature={}", tenantId, feature);
            return joinPoint.proceed();

        } catch (FeatureNotAvailableException e) {
            throw e; // 重新抛出自定义异常
        } catch (Exception e) {
            log.error("Error checking feature: tenant={}, feature={}, error={}",
                    tenantId, feature, e.getMessage());
            // 调用失败时，默认允许通过（fail-open策略）
            return joinPoint.proceed();
        }
    }

    /**
     * 获取当前HTTP请求
     */
    private HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }

    /**
     * 功能不可用异常
     */
    public static class FeatureNotAvailableException extends RuntimeException {
        private final String feature;

        public FeatureNotAvailableException(String message, String feature) {
            super(message);
            this.feature = feature;
        }

        public String getFeature() {
            return feature;
        }
    }
}
