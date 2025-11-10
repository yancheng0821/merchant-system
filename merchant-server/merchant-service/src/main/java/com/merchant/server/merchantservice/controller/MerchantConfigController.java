package com.merchant.server.merchantservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.server.common.annotation.RequiresPermission;
import com.merchant.server.common.annotation.Auditable;
import com.merchant.server.merchantservice.dto.MerchantConfigDTO;
import com.merchant.server.merchantservice.entity.Merchant;
import com.merchant.server.merchantservice.entity.MerchantConfig;
import com.merchant.server.merchantservice.service.MerchantConfigService;
import com.merchant.server.merchantservice.service.MerchantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/merchant/config")
@RequiredArgsConstructor
public class MerchantConfigController {

    private final MerchantConfigService merchantConfigService;
    private final MerchantService merchantService;
    private final ObjectMapper objectMapper;
    private final com.merchant.server.merchantservice.client.BusinessServiceClient businessServiceClient;
    
    /**
     * 获取商户完整配置
     */
    @RequiresPermission("settings:view")
    @GetMapping("/{tenantId}")
    public ResponseEntity<MerchantConfigDTO> getMerchantConfig(@PathVariable Long tenantId) {
        log.info("接收到获取商户配置请求，tenantId: {}", tenantId);
        try {
            MerchantConfigDTO config = merchantConfigService.getMerchantConfig(tenantId);
            log.info("成功获取商户配置，resourceTypes: {}", config.getResourceTypes());
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            log.error("获取商户配置失败，tenantId: {}, 错误信息: {}", tenantId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 获取商户资源类型配置
     */
    @RequiresPermission("settings:view")
    @GetMapping("/{tenantId}/resource-types")
    public ResponseEntity<List<String>> getResourceTypes(@PathVariable Long tenantId) {
        try {
            List<String> resourceTypes = merchantConfigService.getResourceTypes(tenantId);
            return ResponseEntity.ok(resourceTypes);
        } catch (Exception e) {
            log.error("获取资源类型配置失败: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 批量创建商户设置（用于商户注册）
     */
    @RequiresPermission("settings:update_merchant")
    @PostMapping("/{tenantId}/batch")
    public ResponseEntity<Void> createMerchantSettings(
            @PathVariable Long tenantId,
            @RequestBody Map<String, Object> settingsData) {
        try {
            log.info("批量创建商户设置 - tenantId: {}", tenantId);
            
            @SuppressWarnings("unchecked")
            Map<String, Map<String, Object>> settings = (Map<String, Map<String, Object>>) settingsData.get("settings");
            
            if (settings != null) {
                for (Map.Entry<String, Map<String, Object>> entry : settings.entrySet()) {
                    String key = entry.getKey();
                    Map<String, Object> setting = entry.getValue();
                    
                    String value = setting.get("value").toString();
                    String description = (String) setting.get("description");
                    
                    // 如果value是对象，需要转换为JSON字符串
                    if (setting.get("value") instanceof Map || setting.get("value") instanceof List) {
                        value = objectMapper.writeValueAsString(setting.get("value"));
                    }
                    
                    merchantConfigService.updateConfigByKey(tenantId, key, value, description);
                }
            }
            
            log.info("批量创建商户设置成功 - tenantId: {}", tenantId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("批量创建商户设置失败 - tenantId: {}, error: {}", tenantId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 更新商户配置
     */
    @RequiresPermission("settings:update_merchant")
    @Auditable(resource = "MERCHANT_CONFIG", action = "UPDATE", resourceIdParam = "tenantId", recordOldValue = true, description = "Update merchant config")
    @PutMapping("/{tenantId}")
    public ResponseEntity<Void> updateMerchantConfig(
            @PathVariable Long tenantId,
            @RequestBody MerchantConfigDTO configDTO) {
        try {
            configDTO.setMerchantId(tenantId);
            merchantConfigService.updateMerchantConfig(tenantId, configDTO);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("更新商户配置失败: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 获取指定配置项
     */
    @RequiresPermission("settings:view")
    @GetMapping("/{tenantId}/config/{configKey}")
    public ResponseEntity<MerchantConfig> getConfigByKey(
            @PathVariable Long tenantId,
            @PathVariable String configKey) {
        try {
            log.info("获取配置项 - tenantId: {}, configKey: {}", tenantId, configKey);
            MerchantConfig config = merchantConfigService.getConfigByKey(tenantId, configKey);
            if (config != null) {
                log.info("配置项查询成功 - configKey: {}, configValue: {}", configKey, config.getConfigValue());
                return ResponseEntity.ok(config);
            } else {
                log.warn("配置项不存在 - tenantId: {}, configKey: {}", tenantId, configKey);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("获取配置项失败: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 更新指定配置项
     */
    @RequiresPermission("settings:update_merchant")
    @Auditable(resource = "MERCHANT_CONFIG_ITEM", action = "UPDATE", resourceIdParam = "tenantId", recordOldValue = true, description = "Update merchant config item")
    @PutMapping("/{tenantId}/config/{configKey}")
    public ResponseEntity<Void> updateConfigByKey(
            @PathVariable Long tenantId,
            @PathVariable String configKey,
            @RequestBody UpdateConfigRequest request) {
        try {
            merchantConfigService.updateConfigByKey(tenantId, configKey, request.getConfigValue(), request.getDescription());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("更新配置项失败: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 获取所有配置项
     */
    @RequiresPermission("settings:view")
    @GetMapping("/{tenantId}/all")
    public ResponseEntity<List<MerchantConfig>> getAllConfigs(@PathVariable Long tenantId) {
        try {
            List<MerchantConfig> configs = merchantConfigService.getAllConfigs(tenantId);
            return ResponseEntity.ok(configs);
        } catch (Exception e) {
            log.error("获取所有配置项失败: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 获取商户基础信息
     */
    @RequiresPermission("settings:view")
    @GetMapping("/{tenantId}/basic")
    public ResponseEntity<Merchant> getMerchantBasicInfo(@PathVariable Long tenantId) {
        try {
            Merchant merchant = merchantService.getMerchantByTenantId(tenantId);
            if (merchant != null) {
                return ResponseEntity.ok(merchant);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("获取商户基础信息失败: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 更新商户基础信息
     */
    @RequiresPermission("settings:update_merchant")
    @Auditable(resource = "MERCHANT", action = "UPDATE", resourceIdParam = "tenantId", recordOldValue = true, description = "Update merchant basic info")
    @PutMapping("/{tenantId}/basic")
    public ResponseEntity<Void> updateMerchantBasicInfo(
            @PathVariable Long tenantId,
            @RequestBody Merchant merchant) {
        try {
            merchant.setTenantId(tenantId);
            merchantService.updateMerchantInfo(merchant);

            // 清除 business-service 中的商户名称缓存
            try {
                businessServiceClient.clearMerchantNameCache(tenantId);
                log.info("Cleared merchant name cache in business-service for tenantId: {}", tenantId);
            } catch (Exception cacheEx) {
                // 缓存清除失败不影响主流程
                log.warn("Failed to clear merchant name cache in business-service for tenantId {}: {}",
                        tenantId, cacheEx.getMessage());
            }

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("更新商户基础信息失败: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // 内部类用于接收更新请求
    public static class UpdateConfigRequest {
        private String configValue;
        private String description;
        
        public String getConfigValue() {
            return configValue;
        }
        
        public void setConfigValue(String configValue) {
            this.configValue = configValue;
        }
        
        public String getDescription() {
            return description;
        }
        
        public void setDescription(String description) {
            this.description = description;
        }
    }
}