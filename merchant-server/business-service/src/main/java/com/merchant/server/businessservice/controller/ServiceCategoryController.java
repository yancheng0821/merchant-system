package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.dto.ServiceCategoryDTO;
import com.merchant.server.businessservice.service.ServiceCategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/business/service-categories")
@RequiredArgsConstructor
public class ServiceCategoryController {
    
    private final ServiceCategoryService serviceCategoryService;
    
    /**
     * 根据租户ID获取所有分类
     */
    @GetMapping
    public ResponseEntity<List<ServiceCategoryDTO>> getCategories(@RequestParam Long tenantId) {
        List<ServiceCategoryDTO> categories = serviceCategoryService.getCategoriesByTenantId(tenantId);
        return ResponseEntity.ok(categories);
    }
    
    /**
     * 根据租户ID和状态获取分类
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ServiceCategoryDTO>> getCategoriesByStatus(
            @RequestParam Long tenantId,
            @PathVariable String status) {
        List<ServiceCategoryDTO> categories = serviceCategoryService.getCategoriesByTenantIdAndStatus(tenantId, status);
        return ResponseEntity.ok(categories);
    }
    
    /**
     * 根据ID获取分类详情
     */
    @GetMapping("/{id}")
    public ResponseEntity<ServiceCategoryDTO> getCategoryById(@PathVariable Long id) {
        ServiceCategoryDTO category = serviceCategoryService.getCategoryById(id);
        return ResponseEntity.ok(category);
    }
    
    /**
     * 创建分类
     */
    @PostMapping
    public ResponseEntity<ServiceCategoryDTO> createCategory(@Valid @RequestBody ServiceCategoryDTO categoryDTO) {
        ServiceCategoryDTO createdCategory = serviceCategoryService.createCategory(categoryDTO);
        return ResponseEntity.ok(createdCategory);
    }
    
    /**
     * 更新分类
     */
    @PutMapping("/{id}")
    public ResponseEntity<ServiceCategoryDTO> updateCategory(@PathVariable Long id, @Valid @RequestBody ServiceCategoryDTO categoryDTO) {
        ServiceCategoryDTO updatedCategory = serviceCategoryService.updateCategory(id, categoryDTO);
        return ResponseEntity.ok(updatedCategory);
    }
    
    /**
     * 删除分类
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        serviceCategoryService.deleteCategory(id);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 检查分类名称是否存在
     */
    @GetMapping("/check-name")
    public ResponseEntity<Boolean> checkNameExists(
            @RequestParam Long tenantId,
            @RequestParam String name,
            @RequestParam(required = false) Long excludeId) {
        boolean exists = serviceCategoryService.existsByName(tenantId, name, excludeId);
        return ResponseEntity.ok(exists);
    }
}