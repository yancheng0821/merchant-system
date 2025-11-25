package com.merchant.server.merchantservice.service;

import com.merchant.server.merchantservice.entity.Invoice;

import java.util.List;

/**
 * 账单服务接口
 */
public interface InvoiceService {

    /**
     * 根据ID查询账单
     * @param id 账单ID
     * @return 账单信息
     */
    Invoice getInvoiceById(Long id);

    /**
     * 根据租户ID查询账单列表
     * @param tenantId 租户ID
     * @return 账单列表
     */
    List<Invoice> getInvoicesByTenantId(Long tenantId);

    /**
     * 根据账单号查询账单
     * @param invoiceNumber 账单号
     * @return 账单信息
     */
    Invoice getInvoiceByNumber(String invoiceNumber);

    /**
     * 创建账单
     * @param invoice 账单信息
     * @return 创建的账单
     */
    Invoice createInvoice(Invoice invoice);

    /**
     * 更新账单
     * @param invoice 账单信息
     * @return 更新后的账单
     */
    Invoice updateInvoice(Invoice invoice);

    /**
     * 删除账单
     * @param id 账单ID
     * @return 是否成功
     */
    boolean deleteInvoice(Long id);

    /**
     * 生成账单号
     * @return 账单号
     */
    String generateInvoiceNumber();

    /**
     * 为订阅生成账单
     * @param subscriptionId 订阅ID
     * @return 生成的账单
     */
    Invoice generateInvoiceForSubscription(Long subscriptionId);

    /**
     * 根据订阅ID查询账单列表
     * @param subscriptionId 订阅ID
     * @return 账单列表
     */
    List<Invoice> getInvoicesBySubscriptionId(Long subscriptionId);
}
