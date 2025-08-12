package com.merchant.server.businessservice.dto.stripe;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Webhook处理结果DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebhookResultDTO {
    private String eventId;
    private String eventType;
    private String status;
    private String message;
    private Long tenantId;
}