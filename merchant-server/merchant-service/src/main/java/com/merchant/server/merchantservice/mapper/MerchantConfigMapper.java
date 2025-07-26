package com.merchant.server.merchantservice.mapper;

import com.merchant.server.merchantservice.entity.MerchantConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface MerchantConfigMapper {
    
    List<MerchantConfig> findByTenantId(@Param("tenantId") Long tenantId);
    
    MerchantConfig findByTenantIdAndKey(@Param("tenantId") Long tenantId, @Param("configKey") String configKey);
    
    int insert(MerchantConfig config);
    
    int updateByTenantIdAndKey(MerchantConfig config);
    
    int deleteByTenantIdAndKey(@Param("tenantId") Long tenantId, @Param("configKey") String configKey);
    
    String getResourceTypes(@Param("tenantId") Long tenantId);
}