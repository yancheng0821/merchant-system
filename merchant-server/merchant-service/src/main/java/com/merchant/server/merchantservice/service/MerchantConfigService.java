package com.merchant.server.merchantservice.service;

import com.merchant.server.merchantservice.dto.MerchantConfigDTO;
import com.merchant.server.merchantservice.entity.MerchantConfig;

import java.util.List;

public interface MerchantConfigService {
    
    /**
     * 获取商户完整配置
     */
    MerchantConfigDTO getMerchantConfig(Long tenantId);
    
    /**
     * 获取商户资源类型配置
     */
    List<String> getResourceTypes(Long tenantId);
    
    /**
     * 更新商户配置
     */
    void updateMerchantConfig(Long tenantId, MerchantConfigDTO configDTO);
    
    /**
     * 获取指定配置项
     */
    MerchantConfig getConfigByKey(Long tenantId, String configKey);
    
    /**
     * 更新指定配置项
     */
    void updateConfigByKey(Long tenantId, String configKey, String configValue, String description);
    
    /**
     * 获取所有配置项
     */
    List<MerchantConfig> getAllConfigs(Long tenantId);
}