package com.merchant.server.authservice.exception;

import com.merchant.server.authservice.util.MessageUtil;
import com.merchant.server.common.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @Autowired
    private MessageSource messageSource;

    @Autowired
    private MessageUtil messageUtil;
    
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Void>> handleRuntimeException(RuntimeException e) {
        log.warn("Runtime exception: {}", e.getMessage());
        String message = e.getMessage();

        // 直接返回原始错误消息，不进行国际化处理
        // 因为某些错误消息（如验证码验证失败）已经是格式化好的完整消息
        // 如果尝试将其作为国际化key处理，会导致消息丢失或变成默认消息

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(message != null ? message : "Bad Request"));
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException e) {
        List<FieldError> fieldErrors = e.getBindingResult().getFieldErrors();
        String message = fieldErrors.stream()
                .map(error -> {
                    String fieldName = error.getField();
                    String defaultMessage = error.getDefaultMessage();
                    // 尝试获取国际化消息
                    try {
                        return messageSource.getMessage(defaultMessage, null, defaultMessage, LocaleContextHolder.getLocale());
                    } catch (Exception ex) {
                        return defaultMessage;
                    }
                })
                .collect(Collectors.joining(", "));
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(message));
    }
    
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ApiResponse<Void>> handleBindException(BindException e) {
        List<FieldError> fieldErrors = e.getBindingResult().getFieldErrors();
        String message = fieldErrors.stream()
                .map(error -> {
                    String fieldName = error.getField();
                    String defaultMessage = error.getDefaultMessage();
                    // 尝试获取国际化消息
                    try {
                        return messageSource.getMessage(defaultMessage, null, defaultMessage, LocaleContextHolder.getLocale());
                    } catch (Exception ex) {
                        return defaultMessage;
                    }
                })
                .collect(Collectors.joining(", "));
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(message));
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception e) {
        log.error("Unhandled exception occurred", e);
        // 使用国际化消息
        String message = messageUtil.getMessage("error.system.internal");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(message));
    }
} 