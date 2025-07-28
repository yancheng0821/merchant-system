package com.merchant.server.businessservice.service.impl;


import com.merchant.server.businessservice.dto.*;
import com.merchant.server.businessservice.entity.Order;
import com.merchant.server.businessservice.entity.Customer;
import com.merchant.server.businessservice.entity.Resource;
import com.merchant.server.businessservice.mapper.*;
import com.merchant.server.businessservice.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import com.merchant.server.common.util.TimeZoneUtils;
import com.merchant.server.common.util.CurrencyUtils;

/**
 * 订单服务实现
 */
@Slf4j
@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {
    
    private final OrderMapper orderMapper;
    private final OrderServiceMapper orderServiceMapper;
    private final CustomerMapper customerMapper;
    private final ServiceMapper serviceMapper;
    private final ResourceMapper resourceMapper;
    
    @Override
    public org.springframework.data.domain.Page<OrderDTO> getOrders(
            Long tenantId, String searchTerm, String paymentStatus, 
            String orderStatus, Long customerId, String startDate, String endDate, Pageable pageable) {
        
        // 计算分页参数
        int offset = pageable.getPageNumber() * pageable.getPageSize();
        int limit = pageable.getPageSize();
        
        // 查询订单列表
        List<Order> orders = orderMapper.selectByConditions(
            tenantId, searchTerm, paymentStatus, orderStatus, customerId, 
            startDate, endDate, offset, limit);
        
        // 查询总数
        int total = orderMapper.countByConditions(
            tenantId, searchTerm, paymentStatus, orderStatus, customerId, 
            startDate, endDate);
        
        // 转换为DTO
        List<OrderDTO> orderDTOs = orders.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
            
        return new PageImpl<>(orderDTOs, pageable, total);
    }
    
    @Override
    public OrderDTO getOrderById(Long id) {
        Order order = orderMapper.selectById(id);
        if (order == null) {
            return null;
        }
        
        OrderDTO dto = convertToDTO(order);
        
        // 加载订单服务明细
        List<com.merchant.server.businessservice.entity.OrderService> services = orderServiceMapper.selectByOrderId(id);
        dto.setServices(services.stream()
            .map(this::convertServiceToDTO)
            .collect(Collectors.toList()));
            
        return dto;
    }
    
    @Override
    @Transactional
    public OrderDTO createOrder(OrderCreateDTO orderCreate) {
        log.info("Starting order creation process...");
        log.info("OrderCreateDTO: {}", orderCreate);
        
        try {
            // 验证客户是否存在
            Customer customer = customerMapper.selectById(orderCreate.getCustomerId());
            if (customer == null) {
                log.error("Customer not found with ID: {}", orderCreate.getCustomerId());
                throw new RuntimeException("Customer not found with ID: " + orderCreate.getCustomerId());
            }
            log.info("Customer found: {} {}", customer.getFirstName(), customer.getLastName());
            
            // 验证资源是否存在（如果提供了资源ID）
            if (orderCreate.getResourceId() != null) {
                Resource resource = resourceMapper.findById(orderCreate.getResourceId());
                if (resource == null) {
                    log.error("Resource not found with ID: {}", orderCreate.getResourceId());
                    throw new RuntimeException("Resource not found with ID: " + orderCreate.getResourceId());
                }
                log.info("Resource found: {}", resource.getName());
            }
            
            // 创建订单
            Order order = new Order();
            order.setTenantId(orderCreate.getTenantId());
            order.setOrderNumber(generateOrderNumber());
            order.setCustomerId(orderCreate.getCustomerId());
            order.setAppointmentId(orderCreate.getAppointmentId());
            order.setResourceId(orderCreate.getResourceId());
            order.setResourceType(orderCreate.getResourceType());
            order.setTaxRate(orderCreate.getTaxRate());
            order.setTipPercentage(orderCreate.getTipPercentage());
            order.setNotes(orderCreate.getNotes());
            order.setOrderStatus("draft");
            order.setPaymentStatus("pending");
            order.setCreatedAt(TimeZoneUtils.getCurrentVancouverTime());
            order.setUpdatedAt(TimeZoneUtils.getCurrentVancouverTime());
            // Set created_by and updated_by to resource_id if available, otherwise null
            order.setCreatedBy(orderCreate.getResourceId());
            order.setUpdatedBy(orderCreate.getResourceId());
            
            log.info("Order object created: {}", order);
            
            // 计算金额
            double subtotal = 0.0;
            for (OrderServiceCreateDTO serviceCreate : orderCreate.getServices()) {
                log.info("Processing service ID: {}", serviceCreate.getServiceId());
                com.merchant.server.businessservice.entity.Service service = serviceMapper.selectById(serviceCreate.getServiceId());
                if (service == null) {
                    log.error("Service not found with ID: {}", serviceCreate.getServiceId());
                    throw new RuntimeException("Service not found with ID: " + serviceCreate.getServiceId());
                }
                log.info("Service found: {} - Price: {}", service.getName(), service.getPrice());
                subtotal += service.getPrice().doubleValue() * serviceCreate.getQuantity();
            }
            
            order.setSubtotal(subtotal);
            order.setTaxAmount(subtotal * orderCreate.getTaxRate());
            order.setTipAmount(subtotal * orderCreate.getTipPercentage() / 100);
            order.setTotalAmount(subtotal + order.getTaxAmount() + order.getTipAmount());
            
            log.info("Order amounts calculated - Subtotal: {}, Tax: {}, Tip: {}, Total: {}", 
                order.getSubtotal(), order.getTaxAmount(), order.getTipAmount(), order.getTotalAmount());
            
            // 插入订单
            log.info("Inserting order into database...");
            orderMapper.insert(order);
            log.info("Order inserted with ID: {}", order.getId());
            
            // 创建订单服务明细
            for (OrderServiceCreateDTO serviceCreate : orderCreate.getServices()) {
                log.info("Creating order service for service ID: {}", serviceCreate.getServiceId());
                com.merchant.server.businessservice.entity.Service service = serviceMapper.selectById(serviceCreate.getServiceId());
                if (service != null) {
                    com.merchant.server.businessservice.entity.OrderService orderService = new com.merchant.server.businessservice.entity.OrderService();
                    orderService.setOrderId(order.getId());
                    orderService.setServiceId(service.getId());
                    orderService.setServiceName(service.getName());
                    orderService.setServiceCategory(service.getCategory() != null ? service.getCategory().getName() : null);
                    orderService.setPrice(service.getPrice().doubleValue());
                    orderService.setQuantity(serviceCreate.getQuantity());
                    orderService.setDuration(service.getDuration());
                    orderService.setAssignedResourceId(serviceCreate.getAssignedResourceId());
                    orderService.setAssignedResourceType(serviceCreate.getAssignedResourceType());
                    orderService.setCreatedAt(TimeZoneUtils.getCurrentVancouverTime());
                    orderService.setUpdatedAt(TimeZoneUtils.getCurrentVancouverTime());
                    
                    log.info("OrderService object: {}", orderService);
                    orderServiceMapper.insert(orderService);
                    log.info("Order service inserted with ID: {}", orderService.getId());
                }
            }
            
            log.info("Order creation completed successfully");
            return getOrderById(order.getId());
            
        } catch (Exception e) {
            log.error("Error during order creation", e);
            throw e;
        }
    }
    
    @Override
    @Transactional
    public OrderDTO updateOrder(Long id, OrderDTO orderUpdate) {
        Order order = orderMapper.selectById(id);
        if (order == null) {
            return null;
        }
        
        // 只允许更新部分字段
        if (orderUpdate.getTipAmount() != null) {
            order.setTipAmount(orderUpdate.getTipAmount());
        }
        if (orderUpdate.getNotes() != null) {
            order.setNotes(orderUpdate.getNotes());
        }
        
        // 重新计算总金额
        order.setTotalAmount(CurrencyUtils.calculateTotal(order.getSubtotal(), order.getTaxAmount(), order.getTipAmount()));
        order.setUpdatedAt(TimeZoneUtils.getCurrentVancouverTime());
        
        orderMapper.updateById(order);
        
        return getOrderById(id);
    }
    
    @Override
    @Transactional
    public boolean cancelOrder(Long id) {
        Order order = orderMapper.selectById(id);
        if (order == null) {
            return false;
        }
        
        // 只能取消未支付的订单
        if (!"pending".equals(order.getPaymentStatus())) {
            return false;
        }
        
        order.setOrderStatus("cancelled");
        order.setUpdatedAt(TimeZoneUtils.getCurrentVancouverTime());
        orderMapper.updateById(order);
        
        return true;
    }
    
    @Override
    public Map<String, Object> getOrderStats(Long tenantId) {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            // 今日统计
            List<Order> todayOrders = orderMapper.selectTodayOrders(tenantId);
            
            // 计算统计数据
            stats.put("todayOrders", todayOrders.size());
            stats.put("todayRevenue", todayOrders.stream()
                .filter(o -> "paid".equals(o.getPaymentStatus()))
                .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0.0)
                .sum());
                
            // 本月统计
            List<Order> monthOrders = orderMapper.selectMonthOrders(tenantId);
            stats.put("monthlyRevenue", monthOrders.stream()
                .filter(o -> "paid".equals(o.getPaymentStatus()))
                .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0.0)
                .sum());
                
            // 待处理订单
            List<Order> pendingOrders = orderMapper.selectPendingOrders(tenantId);
            stats.put("pendingOrders", pendingOrders.size());
            
        } catch (Exception e) {
            log.error("Error fetching order stats for tenant: {}", tenantId, e);
            // 返回默认值
            stats.put("todayOrders", 0);
            stats.put("todayRevenue", 0.0);
            stats.put("monthlyRevenue", 0.0);
            stats.put("pendingOrders", 0);
        }
        
        return stats;
    }
    
    @Override
    public List<OrderDTO> getTodayOrders(Long tenantId) {
        // 简化实现，返回空列表
        return new ArrayList<>();
    }
    
    /**
     * 转换Order为OrderDTO
     */
    private OrderDTO convertToDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setTenantId(order.getTenantId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setCustomerId(order.getCustomerId());
        dto.setAppointmentId(order.getAppointmentId());
        dto.setResourceId(order.getResourceId());
        dto.setResourceType(order.getResourceType());
        dto.setSubtotal(order.getSubtotal());
        dto.setTaxRate(order.getTaxRate());
        dto.setTaxAmount(order.getTaxAmount());
        dto.setTipAmount(order.getTipAmount());
        dto.setTipPercentage(order.getTipPercentage());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setPaymentStatus(order.getPaymentStatus());
        dto.setOrderStatus(order.getOrderStatus());
        dto.setPosTerminalId(order.getPosTerminalId());
        dto.setTransactionId(order.getTransactionId());
        dto.setCardLast4(order.getCardLast4());
        dto.setAuthorizationCode(order.getAuthorizationCode());
        dto.setNotes(order.getNotes());
        dto.setRefundAmount(order.getRefundAmount());
        dto.setRefundReason(order.getRefundReason());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());
        dto.setCompletedAt(order.getCompletedAt());
        
        // 加载客户信息
        if (order.getCustomerId() != null) {
            Customer customer = customerMapper.selectById(order.getCustomerId());
            if (customer != null) {
                dto.setCustomerName(customer.getFirstName() + " " + customer.getLastName());
                dto.setCustomerPhone(customer.getPhone());
            }
        }
        
        // 加载资源信息
        if (order.getResourceId() != null) {
            Resource resource = resourceMapper.findById(order.getResourceId());
            if (resource != null) {
                dto.setResourceName(resource.getName());
            }
        }
        
        // 设置显示值
        dto.setStatusDisplay(getOrderStatusDisplay(order.getOrderStatus()));
        dto.setPaymentMethodDisplay(getPaymentMethodDisplay(order.getPaymentMethod()));
        
        return dto;
    }
    
    /**
     * 转换OrderService为OrderServiceDTO
     */
    private OrderServiceDTO convertServiceToDTO(com.merchant.server.businessservice.entity.OrderService orderService) {
        OrderServiceDTO dto = new OrderServiceDTO();
        dto.setId(orderService.getId());
        dto.setOrderId(orderService.getOrderId());
        dto.setServiceId(orderService.getServiceId());
        dto.setServiceName(orderService.getServiceName());
        dto.setServiceCategory(orderService.getServiceCategory());
        dto.setPrice(orderService.getPrice());
        dto.setQuantity(orderService.getQuantity());
        dto.setDuration(orderService.getDuration());
        dto.setAssignedResourceId(orderService.getAssignedResourceId());
        dto.setAssignedResourceType(orderService.getAssignedResourceType());
        dto.setTotalPrice(orderService.getPrice() * orderService.getQuantity());
        
        // 加载资源名称
        if (orderService.getAssignedResourceId() != null) {
            Resource resource = resourceMapper.findById(orderService.getAssignedResourceId());
            if (resource != null) {
                dto.setAssignedResourceName(resource.getName());
            }
        }
        
        return dto;
    }
    
    /**
     * 生成订单号
     */
    private String generateOrderNumber() {
        return "ORD-" + System.currentTimeMillis() + "-" + 
            String.format("%04d", new Random().nextInt(10000));
    }
    
    /**
     * 驼峰转下划线
     */
    private String camelToSnake(String camelCase) {
        return camelCase.replaceAll("([a-z])([A-Z]+)", "$1_$2").toLowerCase();
    }
    
    /**
     * 获取订单状态显示文本
     */
    private String getOrderStatusDisplay(String status) {
        if (status == null) return "";
        switch (status) {
            case "draft": return "草稿";
            case "confirmed": return "已确认";
            case "in_progress": return "进行中";
            case "completed": return "已完成";
            case "cancelled": return "已取消";
            default: return status;
        }
    }
    
    /**
     * 获取支付方式显示文本
     */
    private String getPaymentMethodDisplay(String method) {
        if (method == null) return "";
        switch (method) {
            case "cash": return "现金";
            case "credit_card": return "信用卡";
            case "debit_card": return "借记卡";
            case "mobile_pay": return "移动支付";
            case "gift_card": return "礼品卡";
            default: return method;
        }
    }
}