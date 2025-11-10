package com.merchant.server.merchantservice.controller;

import com.merchant.server.common.annotation.RequiresPermission;
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
    @RequiresPermission("settings:update_merchant")
    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createMerchant(@RequestBody Map<String, Object> merchantData) {
        try {
            log.info("接收到创建商户请求: {}", merchantData);

            // 构建商户实体
            Merchant merchant = new Merchant();
            Long tenantId = Long.valueOf(merchantData.get("tenantId").toString());

            // 使用传入的商户编码，如果没有传入则生成
            String merchantCode;
            if (merchantData.containsKey("merchantCode") && merchantData.get("merchantCode") != null) {
                merchantCode = merchantData.get("merchantCode").toString();
                log.info("使用传入的商户编码: {}", merchantCode);
            } else {
                // 如果没有传入，则生成商户编码：M + 时间戳(13位) + 3位随机数
                String timestamp = String.valueOf(System.currentTimeMillis());
                int randomNum = (int) (Math.random() * 1000);
                String randomStr = String.format("%03d", randomNum);
                merchantCode = "M" + timestamp + randomStr;
                log.info("生成的商户编码: {}", merchantCode);
            }

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

            // 使用传入的状态，如果没有传入则默认为ACTIVE
            String status = merchantData.containsKey("status") && merchantData.get("status") != null
                    ? merchantData.get("status").toString()
                    : "ACTIVE";
            merchant.setStatus(status);
            log.info("设置商户状态: {}", status);

            // 创建商户
            merchantService.createMerchant(merchant);

            log.info("商户创建成功，id: {}, tenantId: {}, merchantName: {}, merchantCode: {}",
                    merchant.getId(), merchant.getTenantId(), merchant.getMerchantName(), merchant.getMerchantCode());

            return ResponseEntity.ok(ApiResponse.success(Map.of(
                "id", merchant.getId(),
                "tenantId", merchant.getTenantId(),
                "merchantName", merchant.getMerchantName(),
                "merchantCode", merchant.getMerchantCode()
            )));
            
        } catch (Exception e) {
            log.error("创建商户失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("创建商户失败: " + e.getMessage()));
        }
    }
    
    /**
     * 根据租户ID获取商户信息
     */
    @RequiresPermission("settings:view")
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

    /**
     * 根据租户ID获取商户基本信息（用于登录，不需要权限）
     */
    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMerchantByTenantId(@PathVariable Long tenantId) {
        try {
            log.info("获取商户基本信息（登录用），tenantId: {}", tenantId);
            Merchant merchant = merchantService.getMerchantByTenantId(tenantId);

            if (merchant == null) {
                return ResponseEntity.ok(ApiResponse.error("商户不存在"));
            }

            // 只返回必要的基本信息
            Map<String, Object> basicInfo = new java.util.HashMap<>();
            basicInfo.put("id", merchant.getId());
            basicInfo.put("merchantName", merchant.getMerchantName());
            basicInfo.put("timezone", merchant.getTimezone());

            return ResponseEntity.ok(ApiResponse.success(basicInfo));

        } catch (Exception e) {
            log.error("获取商户基本信息失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("获取商户基本信息失败: " + e.getMessage()));
        }
    }
}