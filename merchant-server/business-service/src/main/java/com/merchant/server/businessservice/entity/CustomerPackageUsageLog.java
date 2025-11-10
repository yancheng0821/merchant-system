package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 客户套餐使用记录实体
 */
@Data
public class CustomerPackageUsageLog {

    private Long id;
    private Long tenantId;
    private Long customerId;
    private Long customerPackageId;
    private Long packageId;
    private String packageName;
    private Long serviceId;
    private String serviceName;
    private Long appointmentId;
    private UsageType usageType;
    private Integer quantity;
    private Integer remainingBefore;
    private Integer remainingAfter;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime usageDate;

    private Long staffId;
    private String staffName;
    private String notes;
    private Long verificationCodeId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    /**
     * 使用类型枚举
     */
    public enum UsageType {
        DEDUCT("扣除"),
        REFUND("退款"),
        ADJUSTMENT("调整");

        private final String description;

        UsageType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}
