package com.merchant.server.businessservice.exception;

import com.merchant.server.businessservice.util.MessageUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 全局异常处理器
 */
@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    @Autowired
    private MessageUtil messageUtil;

    /**
     * 处理Bean Validation异常
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        log.error("Validation error: {}", ex.getMessage());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("error", "Validation Error");
        
        // 收集所有字段错误
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            fieldErrors.put(fieldName, errorMessage);
            log.error("Field '{}' validation error: {}", fieldName, errorMessage);
        });
        
        errorResponse.put("fieldErrors", fieldErrors);
        errorResponse.put("message", "Validation failed: " + fieldErrors.values().stream().collect(Collectors.joining(", ")));
        
        return ResponseEntity.badRequest().body(errorResponse);
    }

    /**
     * 处理约束违反异常
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolationException(ConstraintViolationException ex) {
        log.error("Constraint violation: {}", ex.getMessage());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("error", "Constraint Violation");
        
        String violations = ex.getConstraintViolations().stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.joining(", "));
        
        errorResponse.put("message", "Constraint violations: " + violations);
        
        return ResponseEntity.badRequest().body(errorResponse);
    }

    /**
     * 处理绑定异常
     */
    @ExceptionHandler(BindException.class)
    public ResponseEntity<Map<String, Object>> handleBindException(BindException ex) {
        log.error("Bind error: {}", ex.getMessage());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("error", "Bind Error");
        
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            fieldErrors.put(fieldName, errorMessage);
        });
        
        errorResponse.put("fieldErrors", fieldErrors);
        errorResponse.put("message", "Bind failed: " + fieldErrors.values().stream().collect(Collectors.joining(", ")));
        
        return ResponseEntity.badRequest().body(errorResponse);
    }

    /**
     * 处理静态资源未找到异常（通常是健康检查请求根路径导致的）
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoResourceFoundException(NoResourceFoundException ex) {
        // 对于健康检查请求，使用DEBUG级别记录，避免日志污染
        if (ex.getMessage() != null && ex.getMessage().contains("No static resource")) {
            log.debug("Health check request to root path: {}", ex.getMessage());
        } else {
            log.warn("Resource not found: {}", ex.getMessage());
        }
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("error", "Resource Not Found");
        errorResponse.put("message", "The requested resource was not found");
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    /**
     * 处理运行时异常（业务逻辑错误）
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        log.warn("Runtime exception: {}", ex.getMessage());

        String message = ex.getMessage();

        // 使用MessageUtil处理，它内部已经有fallback机制
        // 如果message是key则返回国际化消息，否则返回原message
        if (message != null && messageUtil != null) {
            message = messageUtil.getMessage(message);
        }

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("error", message != null ? message : "Runtime error occurred");
        errorResponse.put("type", ex.getClass().getSimpleName());

        return ResponseEntity.badRequest().body(errorResponse);
    }

    /**
     * 处理其他异常
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        log.error("Unexpected error: ", ex);

        // 使用国际化消息
        String message = messageUtil.getMessage("error.system.internal");

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("error", message);
        errorResponse.put("type", ex.getClass().getSimpleName());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}