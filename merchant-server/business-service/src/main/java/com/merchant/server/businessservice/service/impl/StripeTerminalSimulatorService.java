package com.merchant.server.businessservice.service.impl;

import com.merchant.server.businessservice.entity.StripeAccount;
import com.merchant.server.businessservice.entity.StripeTerminal;
import com.merchant.server.businessservice.mapper.StripeAccountMapper;
import com.merchant.server.businessservice.mapper.StripeTerminalMapper;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.terminal.Location;
import com.stripe.model.terminal.Reader;
import com.stripe.net.RequestOptions;
import com.stripe.param.terminal.LocationCreateParams;
import com.stripe.param.terminal.LocationListParams;
import com.stripe.param.terminal.ReaderCreateParams;
import com.stripe.param.terminal.ReaderListParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Stripe Terminal模拟器服务
 * 用于在测试环境为每个租户创建模拟的Terminal Reader
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StripeTerminalSimulatorService {
    
    @Value("${stripe.api.key}")
    private String stripeApiKey;
    
    private final StripeAccountMapper stripeAccountMapper;
    private final StripeTerminalMapper stripeTerminalMapper;
    
    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
        // 只在测试模式下启用
        if (stripeApiKey != null && stripeApiKey.startsWith("sk_test_")) {
            log.info("Stripe Terminal Simulator Service initialized (TEST MODE)");
        } else {
            log.warn("Stripe Terminal Simulator Service should only be used with test API keys");
        }
    }
    
    /**
     * 为租户创建或获取模拟Terminal Reader
     */
    @Transactional
    public Reader getOrCreateSimulatedReader(Long tenantId, String label) {
        try {
            // 检查是否为测试模式
            if (!stripeApiKey.startsWith("sk_test_")) {
                throw new RuntimeException("Simulated readers can only be created in test mode");
            }
            
            // 获取商户的Stripe账户
            StripeAccount stripeAccount = stripeAccountMapper.selectByTenantId(tenantId);
            if (stripeAccount == null) {
                throw new RuntimeException("Stripe account not found for tenant: " + tenantId);
            }
            
            // 检查是否已有Terminal记录
            StripeTerminal existingTerminal = stripeTerminalMapper.selectByTenantId(tenantId)
                .stream()
                .filter(t -> t.getDeviceType() != null && t.getDeviceType().contains("simulated"))
                .findFirst()
                .orElse(null);
            
            if (existingTerminal != null && existingTerminal.getTerminalId() != null) {
                // 尝试获取现有的Reader
                try {
                    Reader reader = Reader.retrieve(existingTerminal.getTerminalId());
                    log.info("Found existing simulated reader for tenant {}: {}", tenantId, reader.getId());
                    return reader;
                } catch (StripeException e) {
                    log.warn("Existing reader not found, will create new one: {}", e.getMessage());
                }
            }
            
            // 创建或获取Location
            Location location = getOrCreateLocation(tenantId, stripeAccount);
            
            // 创建模拟Reader
            Reader reader = createSimulatedReader(tenantId, location.getId(), label);
            
            // 保存到数据库
            saveTerminalInfo(reader, tenantId, stripeAccount.getStripeAccountId());
            
            return reader;
            
        } catch (StripeException e) {
            log.error("Failed to create simulated reader for tenant {}", tenantId, e);
            throw new RuntimeException("Failed to create simulated reader: " + e.getMessage());
        }
    }
    
    /**
     * 创建模拟的Terminal Reader
     */
    private Reader createSimulatedReader(Long tenantId, String locationId, String label) throws StripeException {
        log.info("Creating simulated reader for tenant {} at location {}", tenantId, locationId);
        
        // 使用Stripe的模拟Reader注册码
        // 在测试模式下，使用特殊的注册码来创建模拟Reader
        Map<String, Object> params = new HashMap<>();
        params.put("registration_code", "simulated-wpe"); // Stripe的模拟Reader代码
        params.put("label", label != null ? label : "Simulated Reader - Tenant " + tenantId);
        params.put("location", locationId);
        
        Reader reader = Reader.create(params);
        log.info("Created simulated reader: {} for tenant {}", reader.getId(), tenantId);
        
        return reader;
    }
    
    /**
     * 获取或创建Location
     */
    private Location getOrCreateLocation(Long tenantId, StripeAccount stripeAccount) throws StripeException {
        // 首先尝试列出现有的Location
        LocationListParams listParams = LocationListParams.builder()
            .setLimit(10L)
            .build();
        
        RequestOptions requestOptions = null;
        if (stripeAccount.getStripeAccountId() != null) {
            requestOptions = RequestOptions.builder()
                .setStripeAccount(stripeAccount.getStripeAccountId())
                .build();
        }
        
        // 查找现有Location
        for (Location location : Location.list(listParams, requestOptions).getData()) {
            log.info("Found existing location: {} for tenant {}", location.getId(), tenantId);
            return location;
        }
        
        // 创建新Location
        log.info("Creating new location for tenant {}", tenantId);
        LocationCreateParams createParams = LocationCreateParams.builder()
            .setDisplayName("Store Location - Tenant " + tenantId)
            .setAddress(LocationCreateParams.Address.builder()
                .setLine1("123 Test Street")
                .setCity("Vancouver")
                .setState("BC")
                .setCountry("CA")
                .setPostalCode("V6B 1A1")
                .build())
            .build();
        
        Location location = Location.create(createParams, requestOptions);
        log.info("Created location: {} for tenant {}", location.getId(), tenantId);
        
        return location;
    }
    
    /**
     * 保存Terminal信息到数据库
     */
    private void saveTerminalInfo(Reader reader, Long tenantId, String stripeAccountId) {
        try {
            // 检查是否已存在
            StripeTerminal existing = stripeTerminalMapper.selectByTerminalId(reader.getId());
            
            if (existing == null) {
                StripeTerminal terminal = new StripeTerminal();
                terminal.setTenantId(tenantId);
                terminal.setStripeAccountId(stripeAccountId);
                terminal.setTerminalId(reader.getId());
                terminal.setLabel(reader.getLabel());
                terminal.setDeviceType(reader.getDeviceType() + "_simulated");
                terminal.setSerialNumber(reader.getSerialNumber());
                terminal.setLocationId(reader.getLocation());
                terminal.setStatus(reader.getStatus());
                terminal.setIpAddress(reader.getIpAddress());
                terminal.setLastSeenAt(LocalDateTime.now());
                terminal.setCreatedAt(LocalDateTime.now());
                terminal.setUpdatedAt(LocalDateTime.now());
                terminal.setDeleted(false);
                
                stripeTerminalMapper.insert(terminal);
                log.info("Saved terminal info to database for tenant {}", tenantId);
            } else {
                // 更新现有记录
                existing.setStatus(reader.getStatus());
                existing.setLastSeenAt(LocalDateTime.now());
                existing.setUpdatedAt(LocalDateTime.now());
                stripeTerminalMapper.updateById(existing);
                log.info("Updated terminal info in database for tenant {}", tenantId);
            }
        } catch (Exception e) {
            log.error("Failed to save terminal info for tenant {}", tenantId, e);
        }
    }
    
    /**
     * 列出租户的所有Terminal
     */
    public java.util.List<StripeTerminal> listTerminalsByTenant(Long tenantId) {
        return stripeTerminalMapper.selectByTenantId(tenantId);
    }
    
    /**
     * 删除模拟Terminal（仅测试用）
     */
    @Transactional
    public boolean deleteSimulatedReader(String terminalId) {
        try {
            if (!stripeApiKey.startsWith("sk_test_")) {
                throw new RuntimeException("Can only delete readers in test mode");
            }
            
            Reader reader = Reader.retrieve(terminalId);
            Reader deletedReader = reader.delete();
            
            // 软删除数据库记录
            StripeTerminal terminal = stripeTerminalMapper.selectByTerminalId(terminalId);
            if (terminal != null) {
                terminal.setDeleted(true);
                terminal.setUpdatedAt(LocalDateTime.now());
                stripeTerminalMapper.updateById(terminal);
            }
            
            return deletedReader.getDeleted();
        } catch (StripeException e) {
            log.error("Failed to delete simulated reader: {}", terminalId, e);
            return false;
        }
    }
}