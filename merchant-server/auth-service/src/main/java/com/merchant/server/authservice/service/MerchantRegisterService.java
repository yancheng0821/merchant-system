package com.merchant.server.authservice.service;

import com.merchant.server.authservice.dto.MerchantRegisterRequest;
import com.merchant.server.authservice.dto.MerchantRegisterResponse;

public interface MerchantRegisterService {
    
    /**
     * 商户管理员注册
     */
    MerchantRegisterResponse registerMerchant(MerchantRegisterRequest request);
}