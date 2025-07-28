package com.merchant.server.merchantservice.service.impl;

import com.merchant.server.merchantservice.entity.Merchant;
import com.merchant.server.merchantservice.mapper.MerchantMapper;
import com.merchant.server.merchantservice.service.MerchantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

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
        merchantMapper.insertMerchant(merchant);
    }
}