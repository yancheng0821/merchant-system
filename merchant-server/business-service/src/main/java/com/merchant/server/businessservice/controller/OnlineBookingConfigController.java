package com.merchant.server.businessservice.controller;

import com.merchant.server.common.annotation.RequiresPermission;
import com.merchant.server.common.dto.ApiResponse;
import com.merchant.server.businessservice.client.MerchantServiceClient;
import com.merchant.server.businessservice.entity.OnlineBookingConfig;
import com.merchant.server.businessservice.mapper.OnlineBookingConfigMapper;
import com.merchant.server.businessservice.service.GooglePlacesService;
import com.merchant.server.businessservice.service.GooglePlacesService.PlaceSearchResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

/**
 * 在线预约配置控制器
 * 用于商户后台管理在线预约设置
 */
@Slf4j
@RestController
@RequestMapping("/api/business/online-booking")
@RequiredArgsConstructor
public class OnlineBookingConfigController {

    private final OnlineBookingConfigMapper onlineBookingConfigMapper;
    private final GooglePlacesService googlePlacesService;
    private final MerchantServiceClient merchantServiceClient;

    /**
     * 获取在线预约配置
     * 如果不存在返回 null，前端处理默认值显示
     */
    @RequiresPermission("settings:update_merchant")
    @GetMapping("/config")
    public ResponseEntity<OnlineBookingConfig> getConfig(@RequestParam Long tenantId) {
        log.info("Getting online booking config for tenant: {}", tenantId);
        OnlineBookingConfig config = onlineBookingConfigMapper.findByTenantId(tenantId);
        return ResponseEntity.ok(config);
    }

    /**
     * 更新在线预约配置
     */
    @RequiresPermission("settings:update_merchant")
    @PutMapping("/config")
    public ResponseEntity<OnlineBookingConfig> updateConfig(
            @RequestParam Long tenantId,
            @RequestBody OnlineBookingConfig config) {

        log.info("Updating online booking config for tenant: {}", tenantId);

        // 检查是否存在配置
        boolean exists = onlineBookingConfigMapper.existsByTenantId(tenantId);

        config.setTenantId(tenantId);
        config.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));

        // 确保 bookingPageSlug 不为空
        // 如果为空或null，生成一个随机的 slug（前端应该在保存前设置好）
        if (config.getBookingPageSlug() == null || config.getBookingPageSlug().trim().isEmpty()) {
            String generatedSlug = generateUniqueSlug();
            config.setBookingPageSlug(generatedSlug);
            log.warn("bookingPageSlug was empty for tenant {}, auto-generated: {}", tenantId, generatedSlug);
        }

        if (exists) {
            onlineBookingConfigMapper.update(config);
        } else {
            config.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
            onlineBookingConfigMapper.insert(config);
        }

        return ResponseEntity.ok(config);
    }

    /**
     * 生成预约页面 slug
     */
    @RequiresPermission("settings:update_merchant")
    @PostMapping("/generate-slug")
    public ResponseEntity<Map<String, String>> generateSlug(@RequestParam Long tenantId) {
        log.info("Generating booking page slug for tenant: {}", tenantId);

        String slug = generateUniqueSlug();

        return ResponseEntity.ok(Map.of("slug", slug));
    }

    /**
     * 检查 slug 是否可用
     */
    @GetMapping("/check-slug")
    public ResponseEntity<Map<String, Object>> checkSlugAvailability(
            @RequestParam String slug,
            @RequestParam(required = false) Long tenantId) {
        log.info("Checking slug availability: {}, tenantId: {}", slug, tenantId);

        // 检查 slug 是否已被使用
        OnlineBookingConfig existingConfig = onlineBookingConfigMapper.findByBookingPageSlug(slug);

        boolean available;
        if (existingConfig == null) {
            // slug 未被使用
            available = true;
        } else if (tenantId != null && existingConfig.getTenantId().equals(tenantId)) {
            // slug 被当前商户使用（自己的 slug）
            available = true;
        } else {
            // slug 被其他商户使用
            available = false;
        }

        return ResponseEntity.ok(Map.of("available", available, "slug", slug));
    }

    /**
     * 自动查询 Google Place ID
     * 根据商户名称和地址从 Google Places API 查询匹配的 Place ID
     */
    @RequiresPermission("settings:update_merchant")
    @PostMapping("/lookup-place-id")
    public ResponseEntity<Map<String, Object>> lookupPlaceId(@RequestParam Long tenantId) {
        log.info("Looking up Google Place ID for tenant: {}", tenantId);

        try {
            // 获取商户信息
            ApiResponse<Map<String, Object>> merchantResponse = merchantServiceClient.getMerchantByTenantId(tenantId);
            if (merchantResponse == null || merchantResponse.getData() == null) {
                log.warn("Merchant not found for tenant: {}", tenantId);
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "error", "MERCHANT_NOT_FOUND",
                    "message", "商户信息不存在"
                ));
            }

            Map<String, Object> merchantInfo = merchantResponse.getData();
            String merchantName = getStringValue(merchantInfo, "merchantName");
            String address = buildFullAddress(merchantInfo);

            if (!StringUtils.hasText(merchantName) && !StringUtils.hasText(address)) {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "error", "NO_ADDRESS",
                    "message", "请先完善商户名称和地址信息"
                ));
            }

            // 调用 Google Places API 搜索
            List<PlaceSearchResult> results = googlePlacesService.searchPlaces(merchantName, address);

            if (results.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "error", "NOT_FOUND",
                    "message", "未找到匹配的商户，请检查地址信息是否正确"
                ));
            }

            // 返回搜索结果
            return ResponseEntity.ok(Map.of(
                "success", true,
                "results", results,
                "searchQuery", (merchantName != null ? merchantName : "") + " " + (address != null ? address : "")
            ));

        } catch (Exception e) {
            log.error("Error looking up Place ID for tenant {}: {}", tenantId, e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                "success", false,
                "error", "API_ERROR",
                "message", "查询失败，请稍后重试"
            ));
        }
    }

    /**
     * 构建完整地址
     */
    private String buildFullAddress(Map<String, Object> merchantInfo) {
        StringBuilder address = new StringBuilder();

        String streetAddress = getStringValue(merchantInfo, "address");
        String city = getStringValue(merchantInfo, "city");
        String province = getStringValue(merchantInfo, "province");
        String country = getStringValue(merchantInfo, "country");
        String postCode = getStringValue(merchantInfo, "postCode");

        if (StringUtils.hasText(streetAddress)) {
            address.append(streetAddress);
        }
        if (StringUtils.hasText(city)) {
            if (address.length() > 0) address.append(", ");
            address.append(city);
        }
        if (StringUtils.hasText(province)) {
            if (address.length() > 0) address.append(", ");
            address.append(province);
        }
        if (StringUtils.hasText(country)) {
            if (address.length() > 0) address.append(", ");
            address.append(country);
        }
        if (StringUtils.hasText(postCode)) {
            if (address.length() > 0) address.append(" ");
            address.append(postCode);
        }

        return address.toString();
    }

    /**
     * 获取字符串值
     */
    private String getStringValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String SLUG_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final int SLUG_LENGTH = 16; // 16位字符，足够长避免重复

    /**
     * 生成唯一的 slug（16位随机字符）
     * 使用 SecureRandom 确保安全性
     */
    private String generateUniqueSlug() {
        int maxAttempts = 10;
        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            StringBuilder slug = new StringBuilder(SLUG_LENGTH);
            for (int i = 0; i < SLUG_LENGTH; i++) {
                slug.append(SLUG_CHARS.charAt(SECURE_RANDOM.nextInt(SLUG_CHARS.length())));
            }
            String generatedSlug = slug.toString();

            // 检查是否已存在
            OnlineBookingConfig existing = onlineBookingConfigMapper.findByBookingPageSlug(generatedSlug);
            if (existing == null) {
                return generatedSlug;
            }
            log.warn("Generated slug {} already exists, retrying...", generatedSlug);
        }

        // 如果多次尝试都失败，生成一个更长的 slug
        StringBuilder slug = new StringBuilder(24);
        for (int i = 0; i < 24; i++) {
            slug.append(SLUG_CHARS.charAt(SECURE_RANDOM.nextInt(SLUG_CHARS.length())));
        }
        return slug.toString();
    }
}
