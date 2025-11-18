package com.merchant.server.businessservice.service.impl;

import com.merchant.server.businessservice.entity.MembershipTier;
import com.merchant.server.businessservice.mapper.MembershipTierMapper;
import com.merchant.server.businessservice.service.MembershipTierService;
import com.merchant.server.common.annotation.Auditable;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 会员等级服务实现类
 */
@Slf4j
@Service
public class MembershipTierServiceImpl implements MembershipTierService {

    @Autowired
    private MembershipTierMapper membershipTierMapper;

    @Override
    public MembershipTier getById(Long id) {
        log.debug("Getting membership tier by id: {}", id);
        return membershipTierMapper.selectById(id);
    }

    @Override
    public List<MembershipTier> getByTenantId(Long tenantId) {
        log.debug("Getting membership tiers for tenant: {}", tenantId);
        return membershipTierMapper.selectByTenantId(tenantId);
    }

    @Override
    public List<MembershipTier> getActiveTiersByTenantId(Long tenantId) {
        log.debug("Getting active membership tiers for tenant: {}", tenantId);
        return membershipTierMapper.selectActiveTiersByTenantId(tenantId);
    }

    @Override
    public MembershipTier getByTenantIdAndCode(Long tenantId, String code) {
        log.debug("Getting membership tier for tenant: {} with code: {}", tenantId, code);
        return membershipTierMapper.selectByTenantIdAndCode(tenantId, code);
    }

    @Override
    @Transactional
    @Auditable(resource = "MEMBERSHIP_TIER", action = "CREATE", resourceIdParam = "", recordOldValue = false, description = "创建会员等级")
    public MembershipTier create(MembershipTier membershipTier) {
        log.info("Creating membership tier: {}", membershipTier);

        // 验证等级代码唯一性
        if (existsByCode(membershipTier.getTenantId(), membershipTier.getCode(), null)) {
            throw new IllegalArgumentException("等级代码已存在: " + membershipTier.getCode());
        }

        // 设置默认值
        if (membershipTier.getIsActive() == null) {
            membershipTier.setIsActive(true);
        }
        if (membershipTier.getIsDeleted() == null) {
            membershipTier.setIsDeleted(false);
        }

        membershipTierMapper.insert(membershipTier);
        log.info("Membership tier created successfully with id: {}", membershipTier.getId());

        return membershipTier;
    }

    @Override
    @Transactional
    @Auditable(resource = "MEMBERSHIP_TIER", action = "UPDATE", resourceIdParam = "id", recordOldValue = true, description = "更新会员等级")
    public MembershipTier update(MembershipTier membershipTier) {
        log.info("Updating membership tier: {}", membershipTier);

        // 验证等级是否存在
        MembershipTier existing = membershipTierMapper.selectById(membershipTier.getId());
        if (existing == null) {
            throw new IllegalArgumentException("会员等级不存在: " + membershipTier.getId());
        }

        // 验证等级代码唯一性（排除当前记录）
        if (existsByCode(membershipTier.getTenantId(), membershipTier.getCode(), membershipTier.getId())) {
            throw new IllegalArgumentException("等级代码已存在: " + membershipTier.getCode());
        }

        membershipTierMapper.update(membershipTier);
        log.info("Membership tier updated successfully: {}", membershipTier.getId());

        return membershipTierMapper.selectById(membershipTier.getId());
    }

    @Override
    @Transactional
    @Auditable(resource = "MEMBERSHIP_TIER", action = "DELETE", resourceIdParam = "id", recordOldValue = true, description = "删除会员等级")
    public void delete(Long id) {
        log.info("Soft deleting membership tier: {}", id);

        // 验证等级是否存在
        MembershipTier existing = membershipTierMapper.selectById(id);
        if (existing == null) {
            throw new IllegalArgumentException("会员等级不存在: " + id);
        }

        // 注意：这是软删除操作，会员等级作为外键关联到会员表
        // 不能物理删除，只标记为已删除
        membershipTierMapper.deleteById(id);
        log.info("Membership tier soft deleted successfully: {}", id);
    }

    @Override
    public boolean existsByCode(Long tenantId, String code, Long excludeId) {
        return membershipTierMapper.existsByTenantIdAndCode(tenantId, code, excludeId);
    }

    @Override
    @Transactional
    public void copyMembershipTiersFromTemplate(Long targetTenantId) {
        log.info("开始从模板租户(tenantId=1)复制会员等级数据到租户: {}", targetTenantId);

        try {
            // 1. 获取模板租户（tenantId=1）的所有会员等级
            List<MembershipTier> templateTiers = membershipTierMapper.selectByTenantId(1L);

            if (templateTiers == null || templateTiers.isEmpty()) {
                log.warn("模板租户(tenantId=1)没有会员等级数据，跳过复制");
                return;
            }

            log.info("找到 {} 个模板会员等级，开始复制", templateTiers.size());

            // 2. 为每个模板等级创建新租户的副本
            int copiedCount = 0;
            for (MembershipTier templateTier : templateTiers) {
                MembershipTier newTier = new MembershipTier();
                newTier.setTenantId(targetTenantId);
                newTier.setName(templateTier.getName());
                newTier.setCode(templateTier.getCode());
                newTier.setRequiredPoints(templateTier.getRequiredPoints());
                newTier.setDiscountRate(templateTier.getDiscountRate());
                newTier.setColor(templateTier.getColor());
                newTier.setIcon(templateTier.getIcon());
                newTier.setBenefits(templateTier.getBenefits());
                newTier.setIsActive(templateTier.getIsActive());
                newTier.setIsDeleted(false);

                membershipTierMapper.insert(newTier);
                copiedCount++;

                log.debug("复制会员等级: {} (code: {}) -> 新ID: {}",
                    newTier.getName(), newTier.getCode(), newTier.getId());
            }

            log.info("会员等级复制完成，共复制 {} 个等级到租户: {}", copiedCount, targetTenantId);

        } catch (Exception e) {
            log.error("复制会员等级失败 - 租户ID: {}", targetTenantId, e);
            throw new RuntimeException("复制会员等级失败: " + e.getMessage(), e);
        }
    }
}
