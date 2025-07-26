package com.merchant.server.merchantservice.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.server.merchantservice.dto.MerchantConfigDTO;
import com.merchant.server.merchantservice.entity.MerchantConfig;
import com.merchant.server.merchantservice.mapper.MerchantConfigMapper;
import com.merchant.server.merchantservice.service.MerchantConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MerchantConfigServiceImpl implements MerchantConfigService {
    
    private final MerchantConfigMapper merchantConfigMapper;
    private final ObjectMapper objectMapper;
    
    @Override
    public MerchantConfigDTO getMerchantConfig(Long tenantId) {
        log.info("获取商户配置，tenantId: {}", tenantId);
        
        try {
            List<MerchantConfig> configs = merchantConfigMapper.findByTenantId(tenantId);
            log.info("查询到 {} 条配置记录", configs != null ? configs.size() : 0);
            
            MerchantConfigDTO configDTO = new MerchantConfigDTO();
            configDTO.setMerchantId(tenantId);
            
            if (configs == null || configs.isEmpty()) {
                log.warn("商户 {} 没有找到配置数据，使用默认配置", tenantId);
                // 设置默认配置
                configDTO.setResourceTypes(Arrays.asList("STAFF"));
                return configDTO;
            }
            
            Map<String, String> configMap = configs.stream()
                    .collect(Collectors.toMap(MerchantConfig::getConfigKey, MerchantConfig::getConfigValue));
            
            // 解析资源类型
            String resourceTypesJson = configMap.get("resource_types");
            if (resourceTypesJson != null) {
                try {
                    List<String> resourceTypes = objectMapper.readValue(resourceTypesJson, new TypeReference<List<String>>() {});
                    configDTO.setResourceTypes(resourceTypes);
                    log.info("解析资源类型成功: {}", resourceTypes);
                } catch (Exception e) {
                    log.error("解析资源类型失败: {}", e.getMessage());
                    configDTO.setResourceTypes(Arrays.asList("STAFF"));
                }
            } else {
                // 默认只支持员工
                configDTO.setResourceTypes(Arrays.asList("STAFF"));
                log.info("未找到资源类型配置，使用默认值: [STAFF]");
            }
            
            // 解析营业时间
            String businessHoursJson = configMap.get("business_hours");
            if (businessHoursJson != null) {
                try {
                    MerchantConfigDTO.BusinessHours businessHours = objectMapper.readValue(businessHoursJson, MerchantConfigDTO.BusinessHours.class);
                    configDTO.setBusinessHours(businessHours);
                } catch (Exception e) {
                    log.error("解析营业时间失败: {}", e.getMessage());
                }
            }
            
            // 解析预约设置
            String appointmentSettingsJson = configMap.get("appointment_settings");
            if (appointmentSettingsJson != null) {
                try {
                    MerchantConfigDTO.AppointmentSettings appointmentSettings = objectMapper.readValue(appointmentSettingsJson, MerchantConfigDTO.AppointmentSettings.class);
                    configDTO.setAppointmentSettings(appointmentSettings);
                } catch (Exception e) {
                    log.error("解析预约设置失败: {}", e.getMessage());
                }
            }
            
            // 解析通知设置
            String notificationSettingsJson = configMap.get("notification_settings");
            if (notificationSettingsJson != null) {
                try {
                    MerchantConfigDTO.NotificationSettings notificationSettings = objectMapper.readValue(notificationSettingsJson, MerchantConfigDTO.NotificationSettings.class);
                    configDTO.setNotificationSettings(notificationSettings);
                } catch (Exception e) {
                    log.error("解析通知设置失败: {}", e.getMessage());
                }
            }
            
            return configDTO;
            
        } catch (Exception e) {
            log.error("获取商户配置失败: {}", e.getMessage(), e);
            // 返回默认配置
            MerchantConfigDTO defaultConfig = new MerchantConfigDTO();
            defaultConfig.setMerchantId(tenantId);
            defaultConfig.setResourceTypes(Arrays.asList("STAFF"));
            return defaultConfig;
        }
    }
    
    @Override
    public List<String> getResourceTypes(Long tenantId) {
        try {
            String resourceTypesJson = merchantConfigMapper.getResourceTypes(tenantId);
            if (resourceTypesJson != null) {
                return objectMapper.readValue(resourceTypesJson, new TypeReference<List<String>>() {});
            }
        } catch (Exception e) {
            log.error("获取资源类型配置失败: {}", e.getMessage(), e);
        }
        
        // 默认返回员工类型
        return Arrays.asList("STAFF");
    }
    
    @Override
    public void updateMerchantConfig(Long tenantId, MerchantConfigDTO configDTO) {
        try {
            // 更新资源类型
            if (configDTO.getResourceTypes() != null) {
                String resourceTypesJson = objectMapper.writeValueAsString(configDTO.getResourceTypes());
                updateConfigByKey(tenantId, "resource_types", resourceTypesJson, "商户支持的资源类型");
            }
            
            // 更新营业时间
            if (configDTO.getBusinessHours() != null) {
                String businessHoursJson = objectMapper.writeValueAsString(configDTO.getBusinessHours());
                updateConfigByKey(tenantId, "business_hours", businessHoursJson, "营业时间配置");
            }
            
            // 更新预约设置
            if (configDTO.getAppointmentSettings() != null) {
                String appointmentSettingsJson = objectMapper.writeValueAsString(configDTO.getAppointmentSettings());
                updateConfigByKey(tenantId, "appointment_settings", appointmentSettingsJson, "预约相关设置");
            }
            
            // 更新通知设置
            if (configDTO.getNotificationSettings() != null) {
                String notificationSettingsJson = objectMapper.writeValueAsString(configDTO.getNotificationSettings());
                updateConfigByKey(tenantId, "notification_settings", notificationSettingsJson, "通知设置");
            }
            
        } catch (Exception e) {
            log.error("更新商户配置失败: {}", e.getMessage(), e);
            throw new RuntimeException("更新商户配置失败", e);
        }
    }
    
    @Override
    public MerchantConfig getConfigByKey(Long tenantId, String configKey) {
        return merchantConfigMapper.findByTenantIdAndKey(tenantId, configKey);
    }
    
    @Override
    public void updateConfigByKey(Long tenantId, String configKey, String configValue, String description) {
        MerchantConfig existingConfig = merchantConfigMapper.findByTenantIdAndKey(tenantId, configKey);
        
        if (existingConfig != null) {
            existingConfig.setConfigValue(configValue);
            existingConfig.setDescription(description);
            merchantConfigMapper.updateByTenantIdAndKey(existingConfig);
        } else {
            MerchantConfig newConfig = new MerchantConfig();
            newConfig.setTenantId(tenantId);
            newConfig.setConfigKey(configKey);
            newConfig.setConfigValue(configValue);
            newConfig.setDescription(description);
            merchantConfigMapper.insert(newConfig);
        }
    }
    
    @Override
    public List<MerchantConfig> getAllConfigs(Long tenantId) {
        return merchantConfigMapper.findByTenantId(tenantId);
    }
}