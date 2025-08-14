package com.merchant.server.analyticsservice.service;

import com.merchant.server.analyticsservice.client.AuthServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * 数据同步定时任务
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSyncScheduler {
    
    private final DataSyncService dataSyncService;
    private final AuthServiceClient authServiceClient;
    
    /**
     * 每天凌晨2点同步所有租户的数据
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void syncAllTenantsData() {
        log.info("Starting scheduled data sync for all tenants");
        
        try {
            // 动态获取所有活跃租户
            List<Map<String, Object>> activeTenants = authServiceClient.getActiveTenants();
            log.info("Found {} active tenants for data sync", activeTenants.size());
            
            for (Map<String, Object> tenant : activeTenants) {
                Long tenantId = ((Number) tenant.get("id")).longValue();
                String tenantName = (String) tenant.get("tenantName");
                log.info("Syncing data for tenant: {} (ID: {})", tenantName, tenantId);
                
                try {
                    dataSyncService.syncDataForTenant(tenantId);
                    log.info("Data sync completed for tenant: {} (ID: {})", tenantName, tenantId);
                } catch (Exception e) {
                    log.error("Error syncing data for tenant: {} (ID: {})", tenantName, tenantId, e);
                }
            }
            
            log.info("Scheduled data sync completed for all {} tenants", activeTenants.size());
        } catch (Exception e) {
            log.error("Error during scheduled data sync", e);
        }
    }
    
    /**
     * 每5分钟同步一次数据（用于测试）
     */
    @Scheduled(fixedRate = 300000) // 5分钟 = 300,000毫秒
    public void syncDataEveryFiveMinutes() {
        log.info("Starting 5-minute data sync for all tenants");
        
        try {
            // 动态获取所有活跃租户
            List<Map<String, Object>> activeTenants = authServiceClient.getActiveTenants();
            log.info("Found {} active tenants for 5-minute sync", activeTenants.size());
            
            for (Map<String, Object> tenant : activeTenants) {
                Long tenantId = ((Number) tenant.get("id")).longValue();
                String tenantName = (String) tenant.get("tenantName");
                
                try {
                    dataSyncService.syncDataForTenant(tenantId);
                    log.info("5-minute data sync completed for tenant: {} (ID: {})", tenantName, tenantId);
                } catch (Exception e) {
                    log.error("Error during 5-minute sync for tenant: {} (ID: {})", tenantName, tenantId, e);
                }
            }
            
            log.info("5-minute data sync completed for all {} tenants", activeTenants.size());
        } catch (Exception e) {
            log.error("Error during 5-minute data sync", e);
        }
    }
} 