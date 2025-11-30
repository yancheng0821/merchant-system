package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.dto.MatchedCustomerDTO;
import com.merchant.server.businessservice.entity.MarketingRule;
import com.merchant.server.businessservice.entity.MarketingSendLog;
import com.merchant.server.businessservice.mapper.MarketingSendLogMapper;
import com.merchant.server.businessservice.service.MarketingRuleService;
import com.merchant.server.common.annotation.Auditable;
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
 * 营销规则管理Controller
 */
@Slf4j
@RestController
@RequestMapping("/api/business/marketing/rules")
public class MarketingRuleController {

    @Autowired
    private MarketingRuleService marketingRuleService;

    /**
     * 获取租户的所有营销规则
     */
    @RequiresPermission("marketing:view_rules")
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllRules(@RequestParam Long tenantId) {
        log.info("Getting marketing rules for tenant: {}", tenantId);

        try {
            List<MarketingRule> rules = marketingRuleService.getByTenantId(tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", rules);
            response.put("total", rules.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting marketing rules for tenant: {}", tenantId, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "获取营销规则列表失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 根据ID获取营销规则
     */
    @RequiresPermission("marketing:view_rules")
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getRuleById(@PathVariable Long id) {
        log.info("Getting marketing rule by id: {}", id);

        try {
            MarketingRule rule = marketingRuleService.getById(id);

            if (rule == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "营销规则不存在");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", rule);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting marketing rule by id: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "获取营销规则失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 创建营销规则
     */
    @Auditable(resource = "MARKETING", action = "CREATE")
    @RequiresPermission("marketing:manage_rules")
    @PostMapping
    public ResponseEntity<Map<String, Object>> createRule(@Valid @RequestBody MarketingRule marketingRule) {
        log.info("Creating marketing rule: {}", marketingRule.getName());

        try {
            MarketingRule created = marketingRuleService.create(marketingRule);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "营销规则创建成功");
            response.put("data", created);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            log.error("Validation error creating marketing rule: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            log.error("Error creating marketing rule", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "创建营销规则失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 更新营销规则
     */
    @Auditable(resource = "MARKETING", action = "UPDATE", resourceIdParam = "id", recordOldValue = true)
    @RequiresPermission("marketing:manage_rules")
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateRule(
            @PathVariable Long id,
            @Valid @RequestBody MarketingRule marketingRule) {
        log.info("Updating marketing rule with id: {}", id);

        try {
            marketingRule.setId(id);
            MarketingRule updated = marketingRuleService.update(marketingRule);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "营销规则更新成功");
            response.put("data", updated);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Validation error updating marketing rule: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            log.error("Error updating marketing rule with id: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "更新营销规则失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 删除营销规则
     */
    @Auditable(resource = "MARKETING", action = "DELETE", resourceIdParam = "id", recordOldValue = true)
    @RequiresPermission("marketing:manage_rules")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteRule(@PathVariable Long id) {
        log.info("Deleting marketing rule with id: {}", id);

        try {
            marketingRuleService.delete(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "营销规则删除成功");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Validation error deleting marketing rule: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            log.error("Error deleting marketing rule with id: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "删除营销规则失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 更新规则启用状态
     */
    @RequiresPermission("marketing:manage_rules")
    @PatchMapping("/{id}/enabled")
    public ResponseEntity<Map<String, Object>> updateEnabled(
            @PathVariable Long id,
            @RequestParam Boolean enabled) {
        log.info("Updating marketing rule {} enabled status to: {}", id, enabled);

        try {
            marketingRuleService.updateEnabled(id, enabled);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", enabled ? "规则已启用" : "规则已禁用");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating marketing rule enabled status", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "更新规则状态失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 获取规则匹配的客户列表
     */
    @RequiresPermission("marketing:view_rules")
    @GetMapping("/{id}/matched-customers")
    public ResponseEntity<Map<String, Object>> getMatchedCustomers(@PathVariable Long id) {
        log.info("Getting matched customers for rule: {}", id);

        try {
            List<MatchedCustomerDTO> customers = marketingRuleService.getMatchedCustomers(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", customers);
            response.put("total", customers.size());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Validation error getting matched customers: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            log.error("Error getting matched customers for rule: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "获取匹配客户失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 立即发送营销规则
     */
    @RequiresPermission("marketing:send")
    @PostMapping("/{id}/send")
    public ResponseEntity<Map<String, Object>> sendNow(@PathVariable Long id) {
        log.info("Sending marketing rule immediately: {}", id);

        try {
            Integer sentCount = marketingRuleService.sendNow(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "发送成功");

            Map<String, Object> data = new HashMap<>();
            data.put("sentCount", sentCount);
            response.put("data", data);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Validation error sending marketing rule: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            log.error("Error sending marketing rule", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "发送失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
