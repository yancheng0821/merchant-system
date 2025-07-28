package com.merchant.server.merchantservice.mapper;

import com.merchant.server.merchantservice.entity.Merchant;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface MerchantMapper {
    
    /**
     * 根据租户ID获取商户信息
     */
    Merchant selectByTenantId(@Param("tenantId") Long tenantId);
    
    /**
     * 根据ID获取商户信息
     */
    Merchant selectById(@Param("id") Long id);
    
    /**
     * 更新商户基础信息
     */
    int updateMerchantInfo(Merchant merchant);
    
    /**
     * 插入商户信息
     */
    int insertMerchant(Merchant merchant);
}