package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.entity.MembershipTier;
import com.merchant.server.businessservice.service.MembershipTierService;
import com.merchant.server.common.annotation.RequiresPermission;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 会员等级管理Controller
 */
@Slf4j
@RestController
@RequestMapping("/api/business/membership-tiers")
public class MembershipTierController {

    @Autowired
    private MembershipTierService membershipTierService;

    /**
     * 获取租户的所有会员等级
     */
    @RequiresPermission("membership_tiers:view")
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllTiers(@RequestParam Long tenantId) {
        log.info("Getting membership tiers for tenant: {}", tenantId);

        try {
            List<MembershipTier> tiers = membershipTierService.getByTenantId(tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", tiers);
            response.put("total", tiers.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting membership tiers for tenant: {}", tenantId, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "获取会员等级列表失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 获取租户的启用会员等级
     */
    @RequiresPermission("membership_tiers:view")
    @GetMapping("/active")
    public ResponseEntity<Map<String, Object>> getActiveTiers(@RequestParam Long tenantId) {
        log.info("Getting active membership tiers for tenant: {}", tenantId);

        try {
            List<MembershipTier> tiers = membershipTierService.getActiveTiersByTenantId(tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", tiers);
            response.put("total", tiers.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting active membership tiers for tenant: {}", tenantId, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "获取启用的会员等级列表失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 根据ID获取会员等级
     */
    @RequiresPermission("membership_tiers:view")
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getTierById(@PathVariable Long id) {
        log.info("Getting membership tier by id: {}", id);

        try {
            MembershipTier tier = membershipTierService.getById(id);

            if (tier == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "会员等级不存在");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", tier);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting membership tier by id: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "获取会员等级失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 创建会员等级
     */
    @RequiresPermission("membership_tiers:create")
    @PostMapping
    public ResponseEntity<Map<String, Object>> createTier(@Valid @RequestBody MembershipTier membershipTier) {
        log.info("Creating membership tier: {}", membershipTier);

        try {
            MembershipTier created = membershipTierService.create(membershipTier);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "会员等级创建成功");
            response.put("data", created);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            log.error("Validation error creating membership tier: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            log.error("Error creating membership tier", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "创建会员等级失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 更新会员等级
     */
    @RequiresPermission("membership_tiers:update")
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateTier(
            @PathVariable Long id,
            @Valid @RequestBody MembershipTier membershipTier) {
        log.info("Updating membership tier with id: {}", id);

        try {
            membershipTier.setId(id);
            MembershipTier updated = membershipTierService.update(membershipTier);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "会员等级更新成功");
            response.put("data", updated);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Validation error updating membership tier: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            log.error("Error updating membership tier with id: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "更新会员等级失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 删除会员等级
     */
    @RequiresPermission("membership_tiers:delete")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteTier(@PathVariable Long id) {
        log.info("Deleting membership tier with id: {}", id);

        try {
            membershipTierService.delete(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "会员等级删除成功");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Validation error deleting membership tier: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            log.error("Error deleting membership tier with id: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "删除会员等级失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 检查等级代码是否存在
     */
    @RequiresPermission("membership_tiers:view")
    @GetMapping("/check-code")
    public ResponseEntity<Map<String, Object>> checkCode(
            @RequestParam Long tenantId,
            @RequestParam String code,
            @RequestParam(required = false) Long excludeId) {
        log.info("Checking if code exists: {} for tenant: {}", code, tenantId);

        try {
            boolean exists = membershipTierService.existsByCode(tenantId, code, excludeId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("exists", exists);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error checking code existence", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "检查等级代码失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 从模板租户复制会员等级（用于新商户注册）
     */
    @PostMapping("/copy-from-template")
    public ResponseEntity<Map<String, Object>> copyFromTemplate(@RequestParam Long tenantId) {
        log.info("Copying membership tiers from template to tenant: {}", tenantId);

        try {
            membershipTierService.copyMembershipTiersFromTemplate(tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "会员等级复制成功");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error copying membership tiers for tenant: {}", tenantId, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "复制会员等级失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
