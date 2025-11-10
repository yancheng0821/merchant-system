package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.CustomerPreferredResource;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CustomerPreferredResourceMapper {

    /**
     * 根据客户ID和资源ID查询偏好
     */
    CustomerPreferredResource findByCustomerIdAndResourceId(
        @Param("customerId") Long customerId,
        @Param("resourceId") Long resourceId
    );

    /**
     * 根据客户ID查询所有偏好技师
     */
    List<CustomerPreferredResource> findByCustomerId(@Param("customerId") Long customerId);

    /**
     * 根据客户ID查询高偏好技师(4星及以上)
     */
    List<CustomerPreferredResource> findHighPreferenceByCustomerId(@Param("customerId") Long customerId);

    /**
     * 根据资源ID查询偏好该技师的客户
     */
    List<CustomerPreferredResource> findByResourceId(@Param("resourceId") Long resourceId);

    /**
     * 插入偏好记录
     */
    void insert(CustomerPreferredResource preferredResource);

    /**
     * 更新偏好记录
     */
    void update(CustomerPreferredResource preferredResource);

    /**
     * 删除偏好记录
     */
    void deleteByCustomerIdAndResourceId(
        @Param("customerId") Long customerId,
        @Param("resourceId") Long resourceId
    );

    /**
     * 删除客户的所有偏好记录
     */
    void deleteByCustomerId(@Param("customerId") Long customerId);
}
