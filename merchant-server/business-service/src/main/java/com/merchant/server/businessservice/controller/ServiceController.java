package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.entity.Service;
import com.merchant.server.businessservice.mapper.ServiceMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
public class ServiceController {
    
    @Autowired
    private ServiceMapper serviceMapper;
    
    /**
     * 获取服务列表
     */
    @GetMapping
    public ResponseEntity<List<Service>> getServices(
            @RequestParam Long tenantId,
            @RequestParam(required = false) String status) {
        
        List<Service> services;
        if (status != null) {
            services = serviceMapper.selectByTenantIdAndStatus(tenantId, status);
        } else {
            services = serviceMapper.selectByTenantId(tenantId);
        }
        
        return ResponseEntity.ok(services);
    }
    
    /**
     * 获取服务详情
     */
    @GetMapping("/{id}")
    public ResponseEntity<Service> getServiceById(@PathVariable Long id) {
        Service service = serviceMapper.selectById(id);
        if (service == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(service);
    }
}