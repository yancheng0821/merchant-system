package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.MaterialPurchase;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 物料采购记录Mapper
 */
@Mapper
public interface MaterialPurchaseMapper {

    /**
     * 根据租户ID查询所有物料采购记录
     */
    List<MaterialPurchase> selectByTenantId(@Param("tenantId") Long tenantId);

    /**
     * 根据ID查询物料采购记录
     */
    MaterialPurchase selectById(@Param("id") Long id);

    /**
     * 插入物料采购记录
     */
    int insert(MaterialPurchase materialPurchase);

    /**
     * 更新物料采购记录
     */
    int update(MaterialPurchase materialPurchase);

    /**
     * 删除物料采购记录
     */
    int deleteById(@Param("id") Long id);
}
