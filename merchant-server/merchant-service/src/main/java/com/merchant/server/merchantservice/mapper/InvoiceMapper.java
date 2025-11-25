package com.merchant.server.merchantservice.mapper;

import com.merchant.server.merchantservice.entity.Invoice;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface InvoiceMapper {

    /**
     * 根据ID查询账单
     */
    Invoice findById(@Param("id") Long id);

    /**
     * 根据租户ID查询账单列表
     */
    List<Invoice> findByTenantId(@Param("tenantId") Long tenantId);

    /**
     * 根据账单号查询账单
     */
    Invoice findByInvoiceNumber(@Param("invoiceNumber") String invoiceNumber);

    /**
     * 创建账单
     */
    int insert(Invoice invoice);

    /**
     * 更新账单
     */
    int update(Invoice invoice);

    /**
     * 删除账单
     */
    int delete(@Param("id") Long id);

    /**
     * 根据订阅ID查询账单列表
     */
    List<Invoice> findBySubscriptionId(@Param("subscriptionId") Long subscriptionId);
}
