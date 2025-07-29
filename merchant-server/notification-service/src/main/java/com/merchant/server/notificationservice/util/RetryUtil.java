package com.merchant.server.notificationservice.util;

import lombok.extern.slf4j.Slf4j;

import java.util.function.Supplier;

@Slf4j
public class RetryUtil {
    
    /**
     * 重试执行操作
     * @param operation 要执行的操作
     * @param maxRetries 最大重试次数
     * @param delayMs 重试间隔（毫秒）
     * @param operationName 操作名称（用于日志）
     * @return 操作结果
     */
    public static <T> T executeWithRetry(Supplier<T> operation, int maxRetries, long delayMs, String operationName) {
        Exception lastException = null;
        
        for (int attempt = 1; attempt <= maxRetries + 1; attempt++) {
            try {
                return operation.get();
            } catch (Exception e) {
                lastException = e;
                
                if (attempt <= maxRetries) {
                    log.warn("{}执行失败，第{}次重试，错误：{}", operationName, attempt, e.getMessage());
                    
                    if (delayMs > 0) {
                        try {
                            Thread.sleep(delayMs);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            log.warn("重试延迟被中断");
                            break;
                        }
                    }
                } else {
                    log.error("{}执行失败，已达到最大重试次数：{}", operationName, maxRetries, e);
                }
            }
        }
        
        // 如果所有重试都失败，抛出最后一个异常
        if (lastException instanceof RuntimeException) {
            throw (RuntimeException) lastException;
        } else {
            throw new RuntimeException("操作执行失败: " + operationName, lastException);
        }
    }
    
    /**
     * 重试执行布尔操作
     * @param operation 要执行的操作
     * @param maxRetries 最大重试次数
     * @param delayMs 重试间隔（毫秒）
     * @param operationName 操作名称（用于日志）
     * @return 操作结果
     */
    public static boolean executeWithRetryBoolean(Supplier<Boolean> operation, int maxRetries, long delayMs, String operationName) {
        for (int attempt = 1; attempt <= maxRetries + 1; attempt++) {
            try {
                boolean result = operation.get();
                if (result) {
                    return true;
                }
                
                if (attempt <= maxRetries) {
                    log.warn("{}执行返回false，第{}次重试", operationName, attempt);
                    
                    if (delayMs > 0) {
                        try {
                            Thread.sleep(delayMs);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            log.warn("重试延迟被中断");
                            break;
                        }
                    }
                } else {
                    log.error("{}执行失败，已达到最大重试次数：{}", operationName, maxRetries);
                }
            } catch (Exception e) {
                if (attempt <= maxRetries) {
                    log.warn("{}执行异常，第{}次重试，错误：{}", operationName, attempt, e.getMessage());
                    
                    if (delayMs > 0) {
                        try {
                            Thread.sleep(delayMs);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            log.warn("重试延迟被中断");
                            break;
                        }
                    }
                } else {
                    log.error("{}执行异常，已达到最大重试次数：{}", operationName, maxRetries, e);
                }
            }
        }
        
        return false;
    }
}