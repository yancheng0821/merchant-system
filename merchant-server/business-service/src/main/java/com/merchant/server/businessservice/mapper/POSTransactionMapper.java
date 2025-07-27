package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.POSTransaction;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

/**
 * POS交易记录Mapper接口
 */
@Mapper
public interface POSTransactionMapper {
    
    /**
     * 根据交易ID查询
     */
    POSTransaction selectByTransactionId(@Param("transactionId") String transactionId);
    
    /**
     * 查询订单的最后一次交易
     */
    POSTransaction selectLastByOrderId(@Param("orderId") Long orderId);
    
    /**
     * 查询待重试的交易
     */
    List<POSTransaction> selectPendingRetry();
    
    /**
     * 根据ID更新交易记录
     */
    void updateById(POSTransaction transaction);
    
    /**
     * 插入交易记录
     */
    void insert(POSTransaction transaction);
}