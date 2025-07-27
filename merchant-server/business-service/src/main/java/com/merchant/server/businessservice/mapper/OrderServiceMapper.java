package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.OrderService;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

/**
 * 订单服务明细Mapper接口
 */
@Mapper
public interface OrderServiceMapper {
    
    /**
     * 插入订单服务明细
     */
    void insert(OrderService orderService);
    
    /**
     * 根据订单ID查询服务明细
     */
    List<OrderService> selectByOrderId(@Param("orderId") Long orderId);
    
    /**
     * 删除订单的所有服务明细
     */
    void deleteByOrderId(@Param("orderId") Long orderId);
}