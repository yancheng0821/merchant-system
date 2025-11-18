package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.dto.OrderDTO;
import com.merchant.server.businessservice.dto.OrderCreateDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Map;

/**
 * 订单服务接口
 */
public interface OrderService {
    
    /**
     * 分页查询订单
     */
    Page<OrderDTO> getOrders(Long tenantId, String searchTerm, String paymentStatus, String paymentMethod,
                           String orderStatus, Long customerId, String startDate, String endDate, Pageable pageable);
    
    /**
     * 获取订单详情
     */
    OrderDTO getOrderById(Long id);
    
    /**
     * 创建订单
     */
    OrderDTO createOrder(OrderCreateDTO orderCreate);
    
    /**
     * 更新订单
     */
    OrderDTO updateOrder(Long id, OrderDTO orderUpdate);
    
    /**
     * 取消订单
     */
    boolean cancelOrder(Long id);
    
    /**
     * 获取订单统计
     */
    Map<String, Object> getOrderStats(Long tenantId);
    
    /**
     * 获取今日订单
     */
    List<OrderDTO> getTodayOrders(Long tenantId);
}