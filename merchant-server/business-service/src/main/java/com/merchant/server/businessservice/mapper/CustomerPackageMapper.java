package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.CustomerPackage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 客户套餐 Mapper 接口
 *
 * @author System
 * @since 2025-01-21
 */
@Mapper
public interface CustomerPackageMapper {

    /**
     * 根据ID查询客户套餐
     * @param id ID
     * @return 客户套餐信息
     */
    CustomerPackage selectById(@Param("id") Long id);

    /**
     * 根据客户ID获取套餐列表
     * @param customerId 客户ID
     * @return 套餐列表
     */
    List<CustomerPackage> selectByCustomerId(@Param("customerId") Long customerId);

    /**
     * 根据客户ID和状态获取套餐列表
     * @param customerId 客户ID
     * @param status 状态
     * @return 套餐列表
     */
    List<CustomerPackage> selectByCustomerIdAndStatus(@Param("customerId") Long customerId, @Param("status") String status);

    /**
     * 根据套餐ID获取购买该套餐的所有客户
     * @param packageId 套餐ID
     * @return 客户套餐列表
     */
    List<CustomerPackage> selectByPackageId(@Param("packageId") Long packageId);

    /**
     * 根据租户ID和客户ID获取有效套餐
     * @param tenantId 租户ID
     * @param customerId 客户ID
     * @return 有效套餐列表
     */
    List<CustomerPackage> selectActiveByCustomerId(@Param("tenantId") Long tenantId, @Param("customerId") Long customerId);

    /**
     * 插入客户套餐
     * @param customerPackage 客户套餐信息
     * @return 影响行数
     */
    int insert(CustomerPackage customerPackage);

    /**
     * 更新客户套餐
     * @param customerPackage 客户套餐信息
     * @return 影响行数
     */
    int updateById(CustomerPackage customerPackage);

    /**
     * 删除客户套餐
     * @param id ID
     * @return 影响行数
     */
    int deleteById(@Param("id") Long id);
}