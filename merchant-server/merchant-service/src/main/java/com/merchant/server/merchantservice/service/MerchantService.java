package com.merchant.server.merchantservice.service;

import com.merchant.server.merchantservice.entity.Merchant;

public interface MerchantService {
    
    /**
     * 根据租户ID获取商户信息
     */
    Merchant getMerchantByTenantId(Long tenantId);
    
    /**
     * 更新商户基础信息
     */
    void updateMerchantInfo(Merchant merchant);
    
    /**
     * 创建商户
     */
    void createMerchant(Merchant merchant);
}