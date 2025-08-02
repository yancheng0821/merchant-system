package com.merchant.server.merchantservice.controller;

import com.merchant.server.common.dto.ApiResponse;
import com.merchant.server.merchantservice.entity.Merchant;
import com.merchant.server.merchantservice.service.MerchantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/merchant")
@RequiredArgsConstructor
public class MerchantController {
    
    private final MerchantService merchantService;
    
    /**
     * 创建商户
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createMerchant(@RequestBody Map<String, Object> merchantData) {
        try {
            log.info("接收到创建商户请求: {}", merchantData);
            
            // 构建商户实体
            Merchant merchant = new Merchant();
            Long tenantId = Long.valueOf(merchantData.get("tenantId").toString());
            
            // 生成商户编码：M + 租户ID + 时间戳后6位
            String merchantCode = "M" + tenantId + System.currentTimeMillis() % 1000000;
            log.info("生成的商户编码: {}", merchantCode);
            
            merchant.setTenantId(tenantId);
            merchant.setMerchantCode(merchantCode);
            log.info("设置商户编码后，merchant.getMerchantCode(): {}", merchant.getMerchantCode());
            merchant.setMerchantName(merchantData.get("merchantName").toString());
            merchant.setMerchantType("INDEPENDENT"); // 设置默认商户类型
            merchant.setBusinessCategory((String) merchantData.get("businessCategory"));
            merchant.setBusinessLicense((String) merchantData.get("businessLicense"));
            merchant.setContactPerson(merchantData.get("contactPerson").toString());
            merchant.setContactPhone(merchantData.get("contactPhone").toString());
            merchant.setContactEmail((String) merchantData.get("contactEmail"));
            merchant.setAddress((String) merchantData.get("address"));
            merchant.setProvince((String) merchantData.get("province"));
            merchant.setCity((String) merchantData.get("city"));
            merchant.setPostCode((String) merchantData.get("postCode")); // 设置邮政编码
            merchant.setTimezone((String) merchantData.get("timezone"));
            merchant.setStatus("ACTIVE");
            
            // 创建商户
            merchantService.createMerchant(merchant);
            
            log.info("商户创建成功，id: {}, tenantId: {}, merchantName: {}", 
                    merchant.getId(), merchant.getTenantId(), merchant.getMerchantName());
            
            return ResponseEntity.ok(ApiResponse.success(Map.of(
                "id", merchant.getId(),
                "tenantId", merchant.getTenantId(),
                "merchantName", merchant.getMerchantName()
            )));
            
        } catch (Exception e) {
            log.error("创建商户失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("创建商户失败: " + e.getMessage()));
        }
    }
    
    /**
     * 根据租户ID获取商户信息
     */
    @GetMapping("/{tenantId}")
    public ResponseEntity<ApiResponse<Merchant>> getMerchant(@PathVariable Long tenantId) {
        try {
            log.info("获取商户信息，tenantId: {}", tenantId);
            Merchant merchant = merchantService.getMerchantByTenantId(tenantId);
            
            if (merchant == null) {
                return ResponseEntity.ok(ApiResponse.error("商户不存在"));
            }
            
            return ResponseEntity.ok(ApiResponse.success(merchant));
            
        } catch (Exception e) {
            log.error("获取商户信息失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("获取商户信息失败: " + e.getMessage()));
        }
    }
}