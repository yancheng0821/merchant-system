package com.merchant.server.businessservice.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

/**
 * 公开服务信息DTO - 用于客户预约页面展示
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicServiceDTO {

    private Long id;
    private String name;
    private String description;
    private Integer duration;  // 分钟
    private BigDecimal price;
    private String categoryName;
    private Long categoryId;
    private String imageUrl;
    private Boolean availableOnline;  // 是否支持在线预约
    private Integer sortOrder;
}
