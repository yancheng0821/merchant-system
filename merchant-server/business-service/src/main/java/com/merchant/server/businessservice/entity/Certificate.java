package com.merchant.server.businessservice.entity;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 证书管理实体
 */
@Data
public class Certificate {

    private Long id;

    private Long tenantId;

    private String certificateName;

    private String certificateType;

    private String certificateNumber;

    private LocalDate issueDate;

    private LocalDate expiryDate;

    private String issuingAuthority;

    private BigDecimal renewalFee;

    private String status;

    private String attachmentUrl;

    private String notes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Long createdBy;

    private Long updatedBy;
}
