package com.merchant.server.businessservice.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

@Data
public class ServiceCategoryDTO {
    
    private Long id;
    
    @NotNull(message = "租户ID不能为空")
    private Long tenantId;
    
    @NotBlank(message = "分类名称不能为空")
    @Size(max = 100, message = "分类名称长度不能超过100个字符")
    private String name;
    
    private String description;
    
    @Size(max = 50, message = "图标长度不能超过50个字符")
    private String icon;
    
    @Size(max = 20, message = "颜色长度不能超过20个字符")
    private String color;
    
    @Min(value = 0, message = "排序值不能小于0")
    private Integer sortOrder = 0;
    
    @NotBlank(message = "状态不能为空")
    private String status;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // 统计信息
    private Integer serviceCount;
}