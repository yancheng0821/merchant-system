package com.merchant.server.businessservice.entity;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 固定成本记录实体
 */
@Data
public class FixedCost {

    private Long id;

    private Long tenantId;

    private String costType;

    private String costName;

    private BigDecimal amount;

    private String billingCycle;

    private LocalDate paymentDate;

    private LocalDate startDate;

    private LocalDate endDate;

    private String vendor;

    private String paymentMethod;

    private String status;

    private String notes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Long createdBy;

    private Long updatedBy;
}
