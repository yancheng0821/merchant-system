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

    /**
     * 获取商户时区
     * @param tenantId 租户ID
     * @return 时区字符串（IANA格式），如 "America/Vancouver"
     */
    String getMerchantTimezone(Long tenantId);
}