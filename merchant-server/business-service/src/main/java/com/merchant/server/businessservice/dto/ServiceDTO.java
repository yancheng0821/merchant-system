package com.merchant.server.businessservice.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ServiceDTO {
    
    private Long id;
    
    @NotNull(message = "租户ID不能为空")
    private Long tenantId;
    
    @NotNull(message = "分类ID不能为空")
    private Long categoryId;
    
    @NotBlank(message = "服务名称不能为空")
    @Size(max = 100, message = "服务名称长度不能超过100个字符")
    private String name;
    
    private String description;
    
    @NotNull(message = "价格不能为空")
    @DecimalMin(value = "0.01", message = "价格必须大于0")
    @Digits(integer = 8, fraction = 2, message = "价格格式不正确")
    private BigDecimal price;
    
    @NotNull(message = "时长不能为空")
    @Min(value = 1, message = "时长必须大于0分钟")
    private Integer duration;
    
    @NotBlank(message = "状态不能为空")
    private String status;
    
    @NotBlank(message = "资源类型不能为空")
    private String resourceType;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // 关联信息
    private String categoryName;
    private String categoryIcon;
    private String categoryColor;
}