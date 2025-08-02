package com.merchant.server.authservice.controller;

import com.merchant.server.authservice.dto.MerchantRegisterRequest;
import com.merchant.server.authservice.dto.MerchantRegisterResponse;
import com.merchant.server.authservice.service.MerchantRegisterService;
import com.merchant.server.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Locale;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@Validated
@RequiredArgsConstructor
public class MerchantRegisterController {
    
    private final MerchantRegisterService merchantRegisterService;
    
    @PostMapping("/merchant-register")
    public ApiResponse<MerchantRegisterResponse> merchantRegister(
            @RequestHeader(value = "Accept-Language", required = false) String lang,
            @Valid @RequestBody MerchantRegisterRequest request) {
        
        if (lang != null && !lang.isEmpty()) {
            LocaleContextHolder.setLocale(Locale.forLanguageTag(lang));
        }
        
        log.info("收到商户注册请求 - 商户名: {}, 管理员: {}", request.getMerchantName(), request.getUsername());
        log.debug("商户注册请求详情: {}", request);
        
        try {
            MerchantRegisterResponse response = merchantRegisterService.registerMerchant(request);
            log.info("商户注册成功 - 商户ID: {}, 管理员: {}", response.getMerchantId(), response.getUsername());
            log.debug("商户注册响应: merchantId={}, userId={}, invitationCode={}", 
                    response.getMerchantId(), response.getUserId(), response.getInvitationCode());
            
            return ApiResponse.success(response);
        } catch (Exception e) {
            log.error("商户注册失败 - 商户名: {}, 管理员: {}, 错误: {}", 
                    request.getMerchantName(), request.getUsername(), e.getMessage());
            throw e;
        }
    }
}