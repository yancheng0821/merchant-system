package com.merchant.server.businessservice.enums;

/**
 * 支付回调状态枚举
 */
public enum CallbackStatus {
    /**
     * 待处理
     */
    PENDING("pending"),
    
    /**
     * 已处理
     */
    PROCESSED("processed"),
    
    /**
     * 处理失败
     */
    FAILED("failed"),
    
    /**
     * 已忽略
     */
    IGNORED("ignored");
    
    private final String value;
    
    CallbackStatus(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
    
    /**
     * 根据字符串值获取枚举
     */
    public static CallbackStatus fromValue(String value) {
        for (CallbackStatus status : CallbackStatus.values()) {
            if (status.value.equals(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown callback status: " + value);
    }
    
    @Override
    public String toString() {
        return value;
    }
}