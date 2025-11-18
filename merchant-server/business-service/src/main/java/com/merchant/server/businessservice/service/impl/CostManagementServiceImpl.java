package com.merchant.server.businessservice.service.impl;

import com.merchant.server.businessservice.entity.Certificate;
import com.merchant.server.businessservice.entity.FixedCost;
import com.merchant.server.businessservice.entity.MaterialPurchase;
import com.merchant.server.businessservice.mapper.CertificateMapper;
import com.merchant.server.businessservice.mapper.FixedCostMapper;
import com.merchant.server.businessservice.mapper.MaterialPurchaseMapper;
import com.merchant.server.businessservice.service.CostManagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 成本管理服务实现
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CostManagementServiceImpl implements CostManagementService {

    private final CertificateMapper certificateMapper;
    private final FixedCostMapper fixedCostMapper;
    private final MaterialPurchaseMapper materialPurchaseMapper;

    // ============ 证书管理 ============

    @Override
    public List<Certificate> getCertificatesByTenantId(Long tenantId) {
        return certificateMapper.selectByTenantId(tenantId);
    }

    @Override
    public Certificate getCertificateById(Long id) {
        return certificateMapper.selectById(id);
    }

    @Override
    @Transactional
    public Certificate createCertificate(Certificate certificate) {
        certificateMapper.insert(certificate);
        return certificate;
    }

    @Override
    @Transactional
    public Certificate updateCertificate(Certificate certificate) {
        certificateMapper.update(certificate);
        return certificate;
    }

    @Override
    @Transactional
    public void deleteCertificate(Long id, Long tenantId) {
        certificateMapper.deleteById(id);
    }

    // ============ 固定成本记录 ============

    @Override
    public List<FixedCost> getFixedCostsByTenantId(Long tenantId) {
        return fixedCostMapper.selectByTenantId(tenantId);
    }

    @Override
    public FixedCost getFixedCostById(Long id) {
        return fixedCostMapper.selectById(id);
    }

    @Override
    @Transactional
    public FixedCost createFixedCost(FixedCost fixedCost) {
        fixedCostMapper.insert(fixedCost);
        return fixedCost;
    }

    @Override
    @Transactional
    public FixedCost updateFixedCost(FixedCost fixedCost) {
        fixedCostMapper.update(fixedCost);
        return fixedCost;
    }

    @Override
    @Transactional
    public void deleteFixedCost(Long id, Long tenantId) {
        fixedCostMapper.deleteById(id);
    }

    // ============ 物料采购记录 ============

    @Override
    public List<MaterialPurchase> getMaterialPurchasesByTenantId(Long tenantId) {
        return materialPurchaseMapper.selectByTenantId(tenantId);
    }

    @Override
    public MaterialPurchase getMaterialPurchaseById(Long id) {
        return materialPurchaseMapper.selectById(id);
    }

    @Override
    @Transactional
    public MaterialPurchase createMaterialPurchase(MaterialPurchase materialPurchase) {
        materialPurchaseMapper.insert(materialPurchase);
        return materialPurchase;
    }

    @Override
    @Transactional
    public MaterialPurchase updateMaterialPurchase(MaterialPurchase materialPurchase) {
        materialPurchaseMapper.update(materialPurchase);
        return materialPurchase;
    }

    @Override
    @Transactional
    public void deleteMaterialPurchase(Long id, Long tenantId) {
        materialPurchaseMapper.deleteById(id);
    }
}
