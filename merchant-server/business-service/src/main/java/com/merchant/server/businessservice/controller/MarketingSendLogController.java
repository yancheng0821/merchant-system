package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.entity.MarketingSendLog;
import com.merchant.server.businessservice.mapper.MarketingSendLogMapper;
import com.merchant.server.common.annotation.RequiresPermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 营销发送记录Controller
 */
@Slf4j
@RestController
@RequestMapping("/api/business/marketing/logs")
public class MarketingSendLogController {

    @Autowired
    private MarketingSendLogMapper marketingSendLogMapper;

    /**
     * 获取租户的营销发送记录（分页）
     */
    @RequiresPermission("marketing:view_rules")
    @GetMapping
    public ResponseEntity<Map<String, Object>> getLogs(
            @RequestParam Long tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        log.info("Getting marketing send logs for tenant: {}, page: {}, size: {}, status: {}, keyword: {}", tenantId, page, size, status, keyword);

        try {
            int offset = page * size;
            List<MarketingSendLog> logs;
            int total;

            boolean hasStatus = status != null && !status.isEmpty();
            boolean hasKeyword = keyword != null && !keyword.isEmpty();

            if (hasStatus || hasKeyword) {
                logs = marketingSendLogMapper.selectByTenantIdWithFilters(tenantId, status, keyword, offset, size);
                total = marketingSendLogMapper.countByTenantIdWithFilters(tenantId, status, keyword);
            } else {
                logs = marketingSendLogMapper.selectByTenantId(tenantId, offset, size);
                total = marketingSendLogMapper.countByTenantId(tenantId);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", logs);
            response.put("total", total);
            response.put("page", page);
            response.put("size", size);
            response.put("totalPages", (int) Math.ceil((double) total / size));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting marketing send logs for tenant: {}", tenantId, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "获取发送记录失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 根据规则ID获取发送记录（分页）
     */
    @RequiresPermission("marketing:view_rules")
    @GetMapping("/rule/{ruleId}")
    public ResponseEntity<Map<String, Object>> getLogsByRuleId(
            @PathVariable Long ruleId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Getting marketing send logs for rule: {}, page: {}, size: {}", ruleId, page, size);

        try {
            int offset = page * size;
            List<MarketingSendLog> logs = marketingSendLogMapper.selectByRuleId(ruleId, offset, size);
            int total = marketingSendLogMapper.countByRuleId(ruleId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", logs);
            response.put("total", total);
            response.put("page", page);
            response.put("size", size);
            response.put("totalPages", (int) Math.ceil((double) total / size));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting marketing send logs for rule: {}", ruleId, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "获取发送记录失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 根据ID获取发送记录详情
     */
    @RequiresPermission("marketing:view_rules")
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getLogById(@PathVariable Long id) {
        log.info("Getting marketing send log by id: {}", id);

        try {
            MarketingSendLog log1 = marketingSendLogMapper.selectById(id);

            if (log1 == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "发送记录不存在");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", log1);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting marketing send log by id: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "获取发送记录失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
