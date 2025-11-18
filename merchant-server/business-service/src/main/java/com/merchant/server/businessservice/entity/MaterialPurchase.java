package com.merchant.server.businessservice.entity;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 物料采购记录实体
 */
@Data
public class MaterialPurchase {

    private Long id;

    private Long tenantId;

    private String materialName;

    private String materialCategory;

    private BigDecimal quantity;

    private String unit;

    private BigDecimal unitPrice;

    private BigDecimal totalAmount;

    private String supplier;

    private LocalDate purchaseDate;

    private String paymentStatus;

    private String paymentMethod;

    private String notes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Long createdBy;

    private Long updatedBy;
}
