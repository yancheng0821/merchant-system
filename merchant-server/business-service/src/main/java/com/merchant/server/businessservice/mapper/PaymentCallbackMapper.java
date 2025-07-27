package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.PaymentCallback;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

/**
 * 支付回调日志Mapper接口
 */
@Mapper
public interface PaymentCallbackMapper {
    
    /**
     * 查询待处理的回调
     */
    List<PaymentCallback> selectPendingCallbacks();
    
    /**
     * 查询订单的所有回调记录
     */
    List<PaymentCallback> selectByOrderId(@Param("orderId") Long orderId);
    
    /**
     * 根据ID更新回调记录
     */
    void updateById(PaymentCallback callback);
    
    /**
     * 插入回调记录
     */
    void insert(PaymentCallback callback);
}