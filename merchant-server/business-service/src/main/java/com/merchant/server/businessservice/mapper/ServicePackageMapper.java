package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.ServicePackage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 服务套餐 Mapper 接口
 *
 * @author System
 * @since 2025-01-21
 */
@Mapper
public interface ServicePackageMapper {

    /**
     * 根据ID查询套餐
     * @param id 套餐ID
     * @return 套餐信息
     */
    ServicePackage selectById(@Param("id") Long id);

    /**
     * 根据租户ID获取套餐列表
     * @param tenantId 租户ID
     * @return 套餐列表
     */
    List<ServicePackage> selectByTenantId(@Param("tenantId") Long tenantId);

    /**
     * 根据租户ID和状态获取套餐列表
     * @param tenantId 租户ID
     * @param status 状态
     * @return 套餐列表
     */
    List<ServicePackage> selectByTenantIdAndStatus(@Param("tenantId") Long tenantId, @Param("status") String status);

    /**
     * 根据ID和租户ID获取套餐
     * @param id 套餐ID
     * @param tenantId 租户ID
     * @return 套餐信息
     */
    ServicePackage selectByIdAndTenantId(@Param("id") Long id, @Param("tenantId") Long tenantId);

    /**
     * 插入套餐
     * @param servicePackage 套餐信息
     * @return 影响行数
     */
    int insert(ServicePackage servicePackage);

    /**
     * 更新套餐
     * @param servicePackage 套餐信息
     * @return 影响行数
     */
    int updateById(ServicePackage servicePackage);

    /**
     * 删除套餐
     * @param id 套餐ID
     * @return 影响行数
     */
    int deleteById(@Param("id") Long id);
}