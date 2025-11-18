package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.FixedCost;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 固定成本记录Mapper
 */
@Mapper
public interface FixedCostMapper {

    /**
     * 根据租户ID查询所有固定成本
     */
    List<FixedCost> selectByTenantId(@Param("tenantId") Long tenantId);

    /**
     * 根据ID查询固定成本
     */
    FixedCost selectById(@Param("id") Long id);

    /**
     * 插入固定成本
     */
    int insert(FixedCost fixedCost);

    /**
     * 更新固定成本
     */
    int update(FixedCost fixedCost);

    /**
     * 删除固定成本
     */
    int deleteById(@Param("id") Long id);
}
