package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.Order;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.time.LocalDateTime;
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
                                  @Param("paymentMethod") String paymentMethod,
                                  @Param("orderStatus") String orderStatus,
                                  @Param("customerId") Long customerId,
                                  @Param("startDate") String startDate,
                                  @Param("endDate") String endDate,
                                  @Param("startDateTime") LocalDateTime startDateTime,
                                  @Param("endDateTime") LocalDateTime endDateTime,
                                  @Param("offset") int offset,
                                  @Param("limit") int limit);

    /**
     * 统计订单数量
     */
    int countByConditions(@Param("tenantId") Long tenantId,
                         @Param("searchTerm") String searchTerm,
                         @Param("paymentStatus") String paymentStatus,
                         @Param("paymentMethod") String paymentMethod,
                         @Param("orderStatus") String orderStatus,
                         @Param("customerId") Long customerId,
                         @Param("startDate") String startDate,
                         @Param("endDate") String endDate,
                         @Param("startDateTime") LocalDateTime startDateTime,
                         @Param("endDateTime") LocalDateTime endDateTime);
    
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
    
    /**
     * Dashboard 相关查询
     */
    List<java.util.Map<String, Object>> selectOrdersByDate(@Param("tenantId") Long tenantId, @Param("date") String date);
    List<java.util.Map<String, Object>> selectOrdersByDateRange(@Param("tenantId") Long tenantId, @Param("startDate") String startDate, @Param("endDate") String endDate);

    // 使用 datetime 范围查询订单 (用于 Dashboard 时区转换)
    List<java.util.Map<String, Object>> selectOrdersByDateTimeRange(@Param("tenantId") Long tenantId, @Param("startDateTime") LocalDateTime startDateTime, @Param("endDateTime") LocalDateTime endDateTime);
    
    /**
     * 获取订单统计数据用于分析
     */
    List<java.util.Map<String, Object>> getOrderStatsForAnalytics(@Param("tenantId") Long tenantId, 
                                                                  @Param("startDate") String startDate, 
                                                                  @Param("endDate") String endDate);
    
    /**
     * 获取业务指标数据用于分析
     */
    java.util.Map<String, Object> getBusinessMetricsForAnalytics(@Param("tenantId") Long tenantId, 
                                                                 @Param("startDate") String startDate, 
                                                                 @Param("endDate") String endDate);
    
    /**
     * 获取资源统计数据用于分析
     */
    List<java.util.Map<String, Object>> getResourceStatsForAnalytics(@Param("tenantId") Long tenantId,
                                                                     @Param("startDate") String startDate,
                                                                     @Param("endDate") String endDate);

    /**
     * 根据预约ID查询订单（用于员工通知）
     */
    Order selectByAppointmentId(@Param("appointmentId") Long appointmentId);

    /**
     * 按服务维度统计订单
     */
    List<java.util.Map<String, Object>> getOrderStatsByService(@Param("tenantId") Long tenantId,
                                                                @Param("startDate") String startDate,
                                                                @Param("endDate") String endDate);

    /**
     * 按支付方式维度统计订单
     */
    List<java.util.Map<String, Object>> getOrderStatsByPaymentMethod(@Param("tenantId") Long tenantId,
                                                                      @Param("startDate") String startDate,
                                                                      @Param("endDate") String endDate);

    /**
     * 按支付方式统计package购买订单
     */
    List<java.util.Map<String, Object>> getPackagePurchaseStatsByPaymentMethod(@Param("tenantId") Long tenantId,
                                                                                @Param("startDate") String startDate,
                                                                                @Param("endDate") String endDate);
}