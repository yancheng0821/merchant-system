package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.dto.OrderDTO;
import com.merchant.server.businessservice.dto.OrderCreateDTO;
import com.merchant.server.businessservice.dto.OrderServiceCreateDTO;
import com.merchant.server.businessservice.entity.Order;
import com.merchant.server.businessservice.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 订单控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/business/orders")
@RequiredArgsConstructor
public class OrderController {
    
    private final OrderService orderService;
    
    /**
     * 分页查询订单
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getOrders(
            @RequestParam Long tenantId,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) String orderStatus,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        
        log.info("Fetching orders for tenant: {}", tenantId);
        
        Sort.Direction direction = "ASC".equalsIgnoreCase(sortDirection) ? 
            Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        Page<OrderDTO> orders = orderService.getOrders(
            tenantId, searchTerm, paymentStatus, orderStatus, customerId, 
            startDate, endDate, pageRequest);
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", orders.getContent());
        response.put("currentPage", orders.getNumber());
        response.put("totalElements", orders.getTotalElements());
        response.put("totalPages", orders.getTotalPages());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 获取订单详情
     */
    @GetMapping("/{id}")
    public ResponseEntity<OrderDTO> getOrderById(@PathVariable Long id) {
        log.info("Fetching order details for id: {}", id);
        
        OrderDTO order = orderService.getOrderById(id);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(order);
    }
    
    /**
     * 创建订单
     */
    @PostMapping
    public ResponseEntity<?> createOrder(@Valid @RequestBody OrderCreateDTO orderCreate) {
        log.info("Creating new order for tenant: {}", orderCreate.getTenantId());
        log.info("Order create data: {}", orderCreate);
        
        // 详细验证输入数据
        if (orderCreate.getTenantId() == null) {
            log.error("Tenant ID is null");
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Tenant ID is required");
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        if (orderCreate.getCustomerId() == null) {
            log.error("Customer ID is null");
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Customer ID is required");
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        if (orderCreate.getServices() == null || orderCreate.getServices().isEmpty()) {
            log.error("Services list is null or empty");
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Services are required");
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        // 验证每个服务
        for (int i = 0; i < orderCreate.getServices().size(); i++) {
            OrderServiceCreateDTO service = orderCreate.getServices().get(i);
            if (service.getServiceId() == null) {
                log.error("Service ID is null at index {}", i);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Service ID is required for service at index " + i);
                return ResponseEntity.badRequest().body(errorResponse);
            }
            if (service.getQuantity() == null || service.getQuantity() <= 0) {
                log.error("Invalid quantity {} at service index {}", service.getQuantity(), i);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Valid quantity is required for service at index " + i);
                return ResponseEntity.badRequest().body(errorResponse);
            }
        }
        
        try {
            OrderDTO createdOrder = orderService.createOrder(orderCreate);
            log.info("Order created successfully with ID: {}", createdOrder.getId());
            return ResponseEntity.ok(createdOrder);
        } catch (Exception e) {
            log.error("Failed to create order", e);
            log.error("Exception type: {}", e.getClass().getSimpleName());
            log.error("Exception message: {}", e.getMessage());
            if (e.getCause() != null) {
                log.error("Root cause: {}", e.getCause().getMessage());
            }
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("error", e.getClass().getSimpleName());
            errorResponse.put("details", e.getCause() != null ? e.getCause().getMessage() : null);
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * 更新订单
     */
    @PutMapping("/{id}")
    public ResponseEntity<OrderDTO> updateOrder(
            @PathVariable Long id,
            @Valid @RequestBody OrderDTO orderUpdate) {
        log.info("Updating order: {}", id);
        
        try {
            OrderDTO updatedOrder = orderService.updateOrder(id, orderUpdate);
            if (updatedOrder == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(updatedOrder);
        } catch (Exception e) {
            log.error("Failed to update order", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 取消订单
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelOrder(@PathVariable Long id) {
        log.info("Cancelling order: {}", id);
        
        Map<String, Object> response = new HashMap<>();
        try {
            boolean success = orderService.cancelOrder(id);
            response.put("success", success);
            response.put("message", success ? "Order cancelled successfully" : "Failed to cancel order");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to cancel order", e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 获取订单统计
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getOrderStats(@RequestParam Long tenantId) {
        log.info("Fetching order statistics for tenant: {}", tenantId);
        
        Map<String, Object> stats = orderService.getOrderStats(tenantId);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * 获取今日订单
     */
    @GetMapping("/today")
    public ResponseEntity<List<OrderDTO>> getTodayOrders(@RequestParam Long tenantId) {
        log.info("Fetching today's orders for tenant: {}", tenantId);
        
        List<OrderDTO> orders = orderService.getTodayOrders(tenantId);
        return ResponseEntity.ok(orders);
    }
}