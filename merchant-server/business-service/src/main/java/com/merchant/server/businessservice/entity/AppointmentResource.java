package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * 预约资源关联实体
 * 用于支持一个预约关联多个资源（如员工+房间）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResource {
    
    /**
     * 主键ID
     */
    private Long id;
    
    /**
     * 预约ID
     */
    private Long appointmentId;
    
    /**
     * 资源ID
     */
    private Long resourceId;
    
    /**
     * 资源类型
     */
    private ResourceType resourceType;
    
    /**
     * 是否为主要资源
     */
    private Boolean isPrimary;
    
    /**
     * 创建时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    // 关联对象（查询时动态加载）
    /**
     * 资源详情
     */
    private Resource resource;
    
    /**
     * 资源名称（冗余字段，用于减少关联查询）
     */
    private String resourceName;
    
    /**
     * 资源状态
     */
    private String resourceStatus;
    
    /**
     * 资源类型枚举
     */
    public enum ResourceType {
        STAFF("员工"),
        ROOM("房间");
        
        private final String description;
        
        ResourceType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}