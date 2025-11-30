package com.merchant.server.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * 通知消息基础类
 * 所有通知消息的通用结构
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationMessage implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 消息唯一ID
     */
    private String messageId;

    /**
     * 消息类型
     */
    private MessageType messageType;

    /**
     * 消息优先级
     */
    @Builder.Default
    private Priority priority = Priority.NORMAL;

    /**
     * 租户ID
     */
    private Long tenantId;

    /**
     * 消息创建时间
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    /**
     * 消息负载（业务数据）
     */
    private Map<String, Object> payload;

    /**
     * 重试次数
     */
    @Builder.Default
    private Integer retryCount = 0;

    /**
     * 最大重试次数
     */
    @Builder.Default
    private Integer maxRetries = 3;

    /**
     * 消息类型枚举
     */
    public enum MessageType {
        APPOINTMENT_CONFIRMATION,
        APPOINTMENT_CANCELLATION,
        APPOINTMENT_COMPLETION,
        APPOINTMENT_REMINDER,
        MARKETING,
        SMS,
        EMAIL
    }

    /**
     * 消息优先级枚举
     */
    public enum Priority {
        URGENT(1),
        NORMAL(5),
        LOW(10);

        private final int value;

        Priority(int value) {
            this.value = value;
        }

        public int getValue() {
            return value;
        }
    }

    /**
     * 增加重试次数
     */
    public void incrementRetry() {
        this.retryCount++;
    }

    /**
     * 是否可以重试
     */
    public boolean canRetry() {
        return this.retryCount < this.maxRetries;
    }
}
