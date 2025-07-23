package com.merchant.server.notificationservice.controller;

import com.merchant.server.notificationservice.entity.NotificationTemplate;
import com.merchant.server.notificationservice.service.TemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/notification/templates")
@RequiredArgsConstructor
@Slf4j
public class NotificationTemplateController {

    private final TemplateService templateService;

    /**
     * 获取租户的所有通知模板
     */
    @GetMapping
    public ResponseEntity<List<NotificationTemplate>> getTemplatesByTenant(@RequestParam Long tenantId) {
        log.info("Getting notification templates for tenant: {}", tenantId);
        List<NotificationTemplate> templates = templateService.getTemplatesByTenantId(tenantId);
        return ResponseEntity.ok(templates);
    }

    /**
     * 根据模板代码获取模板
     */
    @GetMapping("/code/{templateCode}")
    public ResponseEntity<List<NotificationTemplate>> getTemplatesByCode(
            @PathVariable String templateCode,
            @RequestParam Long tenantId) {
        log.info("Getting templates by code: {} for tenant: {}", templateCode, tenantId);
        List<NotificationTemplate> templates = templateService.getTemplatesByCodeAndTenantId(templateCode, tenantId);
        return ResponseEntity.ok(templates);
    }

    /**
     * 创建通知模板
     */
    @PostMapping
    public ResponseEntity<NotificationTemplate> createTemplate(@Valid @RequestBody NotificationTemplate template) {
        log.info("Creating notification template: {}", template.getTemplateCode());
        NotificationTemplate created = templateService.createTemplate(template);
        return ResponseEntity.ok(created);
    }

    /**
     * 更新通知模板
     */
    @PutMapping("/{id}")
    public ResponseEntity<NotificationTemplate> updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody NotificationTemplate template) {
        log.info("Updating notification template: {}", id);
        template.setId(id);
        NotificationTemplate updated = templateService.updateTemplate(template);
        return ResponseEntity.ok(updated);
    }

    /**
     * 删除通知模板
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id) {
        log.info("Deleting notification template: {}", id);
        templateService.deleteTemplate(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 获取预定义的模板代码列表
     */
    @GetMapping("/codes")
    public ResponseEntity<List<String>> getTemplateCodes() {
        List<String> codes = List.of(
            "APPOINTMENT_CONFIRMED",
            "APPOINTMENT_CANCELLED", 
            "APPOINTMENT_COMPLETED",
            "APPOINTMENT_REMINDER"
        );
        return ResponseEntity.ok(codes);
    }

    /**
     * 初始化默认模板
     */
    @PostMapping("/init-default")
    public ResponseEntity<String> initDefaultTemplates(@RequestParam Long tenantId) {
        log.info("Initializing default templates for tenant: {}", tenantId);
        templateService.initDefaultTemplates(tenantId);
        return ResponseEntity.ok("Default templates initialized successfully");
    }
}