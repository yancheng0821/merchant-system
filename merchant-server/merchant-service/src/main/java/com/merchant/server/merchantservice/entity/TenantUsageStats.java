package com.merchant.server.merchantservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 租户使用量统计实体类
 */
@Data
public class TenantUsageStats {

    private Long id;

    private Long tenantId;

    /**
     * 统计月份 YYYY-MM
     */
    private String statMonth;

    /**
     * 本月预约数
     */
    private Integer appointmentCount;

    /**
     * 本月邮件发送数
     */
    private Integer emailCount;

    /**
     * 本月短信发送数
     */
    private Integer smsCount;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
