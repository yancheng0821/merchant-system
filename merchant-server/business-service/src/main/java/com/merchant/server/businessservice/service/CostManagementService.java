package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.entity.Certificate;
import com.merchant.server.businessservice.entity.FixedCost;
import com.merchant.server.businessservice.entity.MaterialPurchase;

import java.util.List;

/**
 * 成本管理服务接口
 */
public interface CostManagementService {

    // ============ 证书管理 ============

    /**
     * 获取租户所有证书
     */
    List<Certificate> getCertificatesByTenantId(Long tenantId);

    /**
     * 根据ID获取证书
     */
    Certificate getCertificateById(Long id);

    /**
     * 创建证书
     */
    Certificate createCertificate(Certificate certificate);

    /**
     * 更新证书
     */
    Certificate updateCertificate(Certificate certificate);

    /**
     * 删除证书
     */
    void deleteCertificate(Long id, Long tenantId);

    // ============ 固定成本记录 ============

    /**
     * 获取租户所有固定成本
     */
    List<FixedCost> getFixedCostsByTenantId(Long tenantId);

    /**
     * 根据ID获取固定成本
     */
    FixedCost getFixedCostById(Long id);

    /**
     * 创建固定成本
     */
    FixedCost createFixedCost(FixedCost fixedCost);

    /**
     * 更新固定成本
     */
    FixedCost updateFixedCost(FixedCost fixedCost);

    /**
     * 删除固定成本
     */
    void deleteFixedCost(Long id, Long tenantId);

    // ============ 物料采购记录 ============

    /**
     * 获取租户所有物料采购记录
     */
    List<MaterialPurchase> getMaterialPurchasesByTenantId(Long tenantId);

    /**
     * 根据ID获取物料采购记录
     */
    MaterialPurchase getMaterialPurchaseById(Long id);

    /**
     * 创建物料采购记录
     */
    MaterialPurchase createMaterialPurchase(MaterialPurchase materialPurchase);

    /**
     * 更新物料采购记录
     */
    MaterialPurchase updateMaterialPurchase(MaterialPurchase materialPurchase);

    /**
     * 删除物料采购记录
     */
    void deleteMaterialPurchase(Long id, Long tenantId);
}
