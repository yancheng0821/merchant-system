package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.dto.ServiceDTO;
import com.merchant.server.businessservice.dto.ServiceQueryDTO;
import com.merchant.server.businessservice.service.ServiceManagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/business/services")
@RequiredArgsConstructor
public class ServiceManagementController {
    
    private final ServiceManagementService serviceManagementService;
    
    /**
     * 分页查询服务
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getServices(
            @RequestParam Long tenantId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        
        ServiceQueryDTO queryDTO = new ServiceQueryDTO();
        queryDTO.setTenantId(tenantId);
        queryDTO.setCategoryId(categoryId);
        queryDTO.setStatus(status);
        queryDTO.setSearchTerm(searchTerm);
        queryDTO.setPage(page);
        queryDTO.setSize(size);
        
        List<ServiceDTO> services = serviceManagementService.getServices(queryDTO);
        int total = serviceManagementService.countServices(queryDTO);
        
        Map<String, Object> response = new HashMap<>();
        response.put("data", services);
        response.put("total", total);
        response.put("page", page);
        response.put("size", size);
        response.put("totalPages", (int) Math.ceil((double) total / size));
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 根据ID获取服务详情
     */
    @GetMapping("/{id}")
    public ResponseEntity<ServiceDTO> getServiceById(@PathVariable Long id) {
        ServiceDTO service = serviceManagementService.getServiceById(id);
        return ResponseEntity.ok(service);
    }
    
    /**
     * 创建服务
     */
    @PostMapping
    public ResponseEntity<ServiceDTO> createService(@Valid @RequestBody ServiceDTO serviceDTO) {
        ServiceDTO createdService = serviceManagementService.createService(serviceDTO);
        return ResponseEntity.ok(createdService);
    }
    
    /**
     * 更新服务
     */
    @PutMapping("/{id}")
    public ResponseEntity<ServiceDTO> updateService(@PathVariable Long id, @Valid @RequestBody ServiceDTO serviceDTO) {
        ServiceDTO updatedService = serviceManagementService.updateService(id, serviceDTO);
        return ResponseEntity.ok(updatedService);
    }
    
    /**
     * 删除服务
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable Long id) {
        serviceManagementService.deleteService(id);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 根据租户ID获取所有服务
     */
    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<ServiceDTO>> getServicesByTenantId(@PathVariable Long tenantId) {
        List<ServiceDTO> services = serviceManagementService.getServicesByTenantId(tenantId);
        return ResponseEntity.ok(services);
    }
    
    /**
     * 根据分类ID获取服务
     */
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<ServiceDTO>> getServicesByCategoryId(
            @RequestParam Long tenantId,
            @PathVariable Long categoryId) {
        List<ServiceDTO> services = serviceManagementService.getServicesByCategoryId(tenantId, categoryId);
        return ResponseEntity.ok(services);
    }
}