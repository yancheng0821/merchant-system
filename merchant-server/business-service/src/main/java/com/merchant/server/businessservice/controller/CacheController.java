package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.service.AppointmentNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 缓存管理控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/business/cache")
@RequiredArgsConstructor
public class CacheController {

    private final AppointmentNotificationService appointmentNotificationService;

    /**
     * 清除商户名称缓存
     * 在商户信息更新后调用此接口
     */
    @DeleteMapping("/merchant-name/{tenantId}")
    public ResponseEntity<Void> clearMerchantNameCache(@PathVariable Long tenantId) {
        log.info("Request to clear merchant name cache for tenantId: {}", tenantId);
        appointmentNotificationService.clearMerchantNameCache(tenantId);
        return ResponseEntity.ok().build();
    }
}
