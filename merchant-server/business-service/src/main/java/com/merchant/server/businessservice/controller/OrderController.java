package com.merchant.server.businessservice.controller;

import com.merchant.server.common.annotation.Auditable;
import com.merchant.server.common.annotation.RequiresPermission;
import com.merchant.server.businessservice.dto.OrderDTO;
import com.merchant.server.businessservice.dto.OrderCreateDTO;
import com.merchant.server.businessservice.dto.OrderServiceCreateDTO;
import com.merchant.server.businessservice.dto.UpdatePaymentMethodRequest;
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
    @RequiresPermission("orders:view")
    @GetMapping
    public ResponseEntity<Map<String, Object>> getOrders(
            @RequestParam Long tenantId,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) String paymentMethod,
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
            tenantId, searchTerm, paymentStatus, paymentMethod, orderStatus, customerId,
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
    @RequiresPermission("orders:view")
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
    @RequiresPermission("orders:create")
    @PostMapping
    public ResponseEntity<?> createOrder(@Valid @RequestBody OrderCreateDTO orderCreate) {
        log.info("Creating new order for tenant: {}", orderCreate.getTenantId());
        
        // 详细验证输入数据
        if (orderCreate.getTenantId() == null) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Tenant ID is required");
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        if (orderCreate.getCustomerId() == null) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Customer ID is required");
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        if (orderCreate.getServices() == null || orderCreate.getServices().isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Services are required");
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        // 验证每个服务
        for (int i = 0; i < orderCreate.getServices().size(); i++) {
            OrderServiceCreateDTO service = orderCreate.getServices().get(i);
            if (service.getServiceId() == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Service ID is required for service at index " + i);
                return ResponseEntity.badRequest().body(errorResponse);
            }
            if (service.getQuantity() == null || service.getQuantity() <= 0) {
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
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * 更新订单
     */
    @RequiresPermission("orders:update")
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
            log.error("Failed to update order: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 取消订单
     */
    @RequiresPermission("orders:delete")
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
            log.error("Failed to cancel order: {}", e.getMessage());
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 更新订单支付方式
     */
    @RequiresPermission("orders:update_payment_method")
    @Auditable(
        resource = "ORDER",
        action = "UPDATE",
        resourceIdParam = "id",
        recordOldValue = true,
        description = "Update order payment method"
    )
    @PutMapping("/{id}/payment-method")
    public ResponseEntity<Map<String, Object>> updatePaymentMethod(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePaymentMethodRequest request) {
        log.info("Updating payment method for order: {}, new method: {}, reason: {}",
                 id, request.getNewPaymentMethod(), request.getReason());

        Map<String, Object> response = new HashMap<>();
        try {
            OrderDTO updatedOrder = orderService.updatePaymentMethod(id, request);
            if (updatedOrder == null) {
                response.put("success", false);
                response.put("message", "Order not found");
                return ResponseEntity.notFound().build();
            }
            response.put("success", true);
            response.put("message", "Payment method updated successfully");
            response.put("order", updatedOrder);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            log.error("Cannot update payment method: {}", e.getMessage());
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            log.error("Failed to update payment method: {}", e.getMessage());
            response.put("success", false);
            response.put("message", "Failed to update payment method");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 获取订单统计
     */
    @RequiresPermission("orders:view_stats")
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getOrderStats(@RequestParam Long tenantId) {
        log.info("Fetching order statistics for tenant: {}", tenantId);
        
        Map<String, Object> stats = orderService.getOrderStats(tenantId);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * 获取今日订单
     */
    @RequiresPermission("orders:view")
    @GetMapping("/today")
    public ResponseEntity<List<OrderDTO>> getTodayOrders(@RequestParam Long tenantId) {
        log.info("Fetching today's orders for tenant: {}", tenantId);
        
        List<OrderDTO> orders = orderService.getTodayOrders(tenantId);
        return ResponseEntity.ok(orders);
    }
}