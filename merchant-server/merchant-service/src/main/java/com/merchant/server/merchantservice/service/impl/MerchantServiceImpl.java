package com.merchant.server.merchantservice.service.impl;

import com.merchant.server.common.config.TimeZoneConfig;
import com.merchant.server.merchantservice.entity.Merchant;
import com.merchant.server.merchantservice.mapper.MerchantMapper;
import com.merchant.server.merchantservice.service.MerchantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class MerchantServiceImpl implements MerchantService {

    private final MerchantMapper merchantMapper;

    @Override
    public Merchant getMerchantByTenantId(Long tenantId) {
        log.info("获取商户信息，tenantId: {}", tenantId);
        return merchantMapper.selectByTenantId(tenantId);
    }

    @Override
    public void updateMerchantInfo(Merchant merchant) {
        log.info("更新商户信息，tenantId: {}, merchantName: {}",
                merchant.getTenantId(), merchant.getMerchantName());
        int result = merchantMapper.updateMerchantInfo(merchant);
        if (result == 0) {
            throw new RuntimeException("更新商户信息失败，未找到对应记录");
        }
    }

    @Override
    public void createMerchant(Merchant merchant) {
        log.info("创建商户，tenantId: {}, merchantName: {}",
                merchant.getTenantId(), merchant.getMerchantName());
        // 如果没有设置时区，使用默认时区
        if (!StringUtils.hasText(merchant.getTimezone())) {
            merchant.setTimezone(TimeZoneConfig.DEFAULT_TIMEZONE);
        }
        merchantMapper.insertMerchant(merchant);
    }

    @Override
    @Cacheable(value = "merchantTimezone", key = "#tenantId", unless = "#result == null")
    public String getMerchantTimezone(Long tenantId) {
        if (tenantId == null) {
            log.warn("tenantId为空，返回默认时区");
            return TimeZoneConfig.DEFAULT_TIMEZONE;
        }

        Merchant merchant = getMerchantByTenantId(tenantId);
        if (merchant == null) {
            log.warn("未找到商户信息，tenantId: {}，返回默认时区", tenantId);
            return TimeZoneConfig.DEFAULT_TIMEZONE;
        }

        String timezone = merchant.getTimezone();
        if (!StringUtils.hasText(timezone)) {
            log.info("商户未设置时区，tenantId: {}，返回默认时区", tenantId);
            return TimeZoneConfig.DEFAULT_TIMEZONE;
        }

        return timezone;
    }
}