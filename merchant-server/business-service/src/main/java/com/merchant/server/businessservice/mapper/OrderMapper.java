package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.Order;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

/**
 * 订单Mapper接口
 */
@Mapper
public interface OrderMapper {
    
    /**
     * 根据ID查询订单
     */
    Order selectById(@Param("id") Long id);
    
    /**
     * 插入订单
     */
    void insert(Order order);
    
    /**
     * 更新订单
     */
    void updateById(Order order);
    
    /**
     * 分页查询订单
     */
    List<Order> selectByConditions(@Param("tenantId") Long tenantId,
                                  @Param("searchTerm") String searchTerm,
                                  @Param("paymentStatus") String paymentStatus,
                                  @Param("orderStatus") String orderStatus,
                                  @Param("customerId") Long customerId,
                                  @Param("startDate") String startDate,
                                  @Param("endDate") String endDate,
                                  @Param("offset") int offset,
                                  @Param("limit") int limit);
    
    /**
     * 统计订单数量
     */
    int countByConditions(@Param("tenantId") Long tenantId,
                         @Param("searchTerm") String searchTerm,
                         @Param("paymentStatus") String paymentStatus,
                         @Param("orderStatus") String orderStatus,
                         @Param("customerId") Long customerId,
                         @Param("startDate") String startDate,
                         @Param("endDate") String endDate);
    
    /**
     * 根据订单号查询
     */
    Order selectByOrderNumber(@Param("orderNumber") String orderNumber);
    
    /**
     * 查询待支付订单
     */
    List<Order> selectPendingOrders(@Param("tenantId") Long tenantId);
    
    /**
     * 查询需要重试的订单
     */
    List<Order> selectRetryableOrders();
    
    /**
     * 查询今日订单
     */
    List<Order> selectTodayOrders(@Param("tenantId") Long tenantId);
    
    /**
     * 查询本月订单
     */
    List<Order> selectMonthOrders(@Param("tenantId") Long tenantId);
}