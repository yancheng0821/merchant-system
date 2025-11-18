package com.merchant.server.businessservice.dto;

import com.merchant.server.businessservice.entity.Resource;
import com.merchant.server.businessservice.entity.ResourceAvailability;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 资源批量详情DTO
 * 用于一次性返回资源及其关联数据，减少API调用次数
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceBatchDetailsDTO {

    /**
     * 资源列表
     */
    private List<Resource> resources;

    /**
     * 资源服务专长映射
     * Key: resourceId, Value: serviceIds列表
     */
    private Map<Long, List<Long>> resourceServices;

    /**
     * 资源可用性映射
     * Key: resourceId, Value: 可用性列表
     */
    private Map<Long, List<ResourceAvailability>> resourceAvailabilities;
}
