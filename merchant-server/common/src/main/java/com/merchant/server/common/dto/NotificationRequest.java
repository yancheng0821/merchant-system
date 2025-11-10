package com.merchant.server.common.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

/**
 * 统一的通知请求
 * 所有通知场景都使用此统一结构发送到MQ
 */
@Data
@Builder
public class NotificationRequest {

    /**
     * 业务场景（使用NotificationScene的code）
     */
    private String scene;

    /**
     * 商户ID（用于获取商户级模板）
     */
    private Long tenantId;

    /**
     * 接收者信息
     */
    private RecipientInfo recipient;

    /**
     * 通知渠道（EMAIL, SMS, 或BOTH）
     */
    private String channel;

    /**
     * 模板变量（用于渲染模板）
     */
    private Map<String, Object> variables;

    /**
     * 业务ID（用于追踪和日志）
     */
    private String businessId;

    /**
     * 模板代码（可选，如果不指定则使用场景默认模板）
     */
    private String templateCode;

    /**
     * 接收者信息
     */
    @Data
    @Builder
    public static class RecipientInfo {
        /**
         * 邮箱地址
         */
        private String email;

        /**
         * 手机号
         */
        private String phone;

        /**
         * 接收者姓名（用于模板变量）
         */
        private String name;
    }
}
