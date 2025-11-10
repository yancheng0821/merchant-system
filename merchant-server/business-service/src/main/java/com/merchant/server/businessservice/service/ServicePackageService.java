package com.merchant.server.businessservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.server.businessservice.dto.ServicePackageDTO;
import com.merchant.server.businessservice.entity.ServicePackage;
import com.merchant.server.businessservice.mapper.ServicePackageMapper;
import com.merchant.server.businessservice.util.MessageUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 服务套餐Service
 *
 * @author System
 * @since 2025-01-21
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ServicePackageService {

    private final ServicePackageMapper servicePackageMapper;
    private final ObjectMapper objectMapper;
    private final MessageUtil messageUtil;

    /**
     * 根据租户ID获取所有套餐
     */
    public List<ServicePackageDTO> getPackagesByTenantId(Long tenantId) {
        List<ServicePackage> packages = servicePackageMapper.selectByTenantId(tenantId);
        return packages.stream().map(this::entityToDto).collect(Collectors.toList());
    }

    /**
     * 根据租户ID和状态获取套餐
     */
    public List<ServicePackageDTO> getPackagesByTenantIdAndStatus(Long tenantId, String status) {
        List<ServicePackage> packages = servicePackageMapper.selectByTenantIdAndStatus(tenantId, status);
        return packages.stream().map(this::entityToDto).collect(Collectors.toList());
    }

    /**
     * 根据ID获取套餐
     */
    public ServicePackageDTO getPackageById(Long id, Long tenantId) {
        ServicePackage servicePackage = servicePackageMapper.selectByIdAndTenantId(id, tenantId);
        if (servicePackage == null) {
            throw new RuntimeException(messageUtil.getMessage("error.service.package.not.found", new Object[]{id}));
        }
        return entityToDto(servicePackage);
    }

    /**
     * 创建套餐
     */
    @Transactional
    public ServicePackageDTO createPackage(ServicePackageDTO dto) {
        ServicePackage entity = dtoToEntity(dto);
        entity.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        entity.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        entity.setStatus("ACTIVE");

        // 计算折扣百分比
        if (entity.getOriginalPrice() != null && entity.getPackagePrice() != null
            && entity.getOriginalPrice().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal discount = entity.getOriginalPrice().subtract(entity.getPackagePrice())
                .divide(entity.getOriginalPrice(), 4, BigDecimal.ROUND_HALF_UP)
                .multiply(new BigDecimal("100"));
            entity.setDiscountPercentage(discount);
        }


        servicePackageMapper.insert(entity);
        return entityToDto(entity);
    }

    /**
     * 更新套餐
     */
    @Transactional
    public ServicePackageDTO updatePackage(Long id, ServicePackageDTO dto) {
        ServicePackage existing = servicePackageMapper.selectByIdAndTenantId(id, dto.getTenantId());
        if (existing == null) {
            throw new RuntimeException(messageUtil.getMessage("error.service.package.not.found", new Object[]{id}));
        }

        ServicePackage entity = dtoToEntity(dto);
        entity.setId(id);
        entity.setCreatedAt(existing.getCreatedAt());
        entity.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));

        // 重新计算折扣百分比
        if (entity.getOriginalPrice() != null && entity.getPackagePrice() != null
            && entity.getOriginalPrice().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal discount = entity.getOriginalPrice().subtract(entity.getPackagePrice())
                .divide(entity.getOriginalPrice(), 4, BigDecimal.ROUND_HALF_UP)
                .multiply(new BigDecimal("100"));
            entity.setDiscountPercentage(discount);
        }

        servicePackageMapper.updateById(entity);
        return entityToDto(entity);
    }

    /**
     * 删除套餐
     */
    @Transactional
    public void deletePackage(Long id, Long tenantId) {
        ServicePackage existing = servicePackageMapper.selectByIdAndTenantId(id, tenantId);
        if (existing == null) {
            throw new RuntimeException(messageUtil.getMessage("error.service.package.not.found", new Object[]{id}));
        }
        servicePackageMapper.deleteById(id);
    }

    /**
     * 实体转DTO
     */
    private ServicePackageDTO entityToDto(ServicePackage entity) {
        ServicePackageDTO dto = new ServicePackageDTO();
        dto.setId(entity.getId());
        dto.setTenantId(entity.getTenantId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setIcon(entity.getIcon());
        dto.setColor(entity.getColor());
        dto.setOriginalPrice(entity.getOriginalPrice());
        dto.setPackagePrice(entity.getPackagePrice());
        dto.setDiscountPercentage(entity.getDiscountPercentage());
        dto.setValidityDays(entity.getValidityDays());
        dto.setMaxSharedUsers(entity.getMaxSharedUsers());
        dto.setTerms(entity.getTerms());
        dto.setStatus(entity.getStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        // 解析 includedServices JSON
        if (entity.getIncludedServices() != null && !entity.getIncludedServices().isEmpty()) {
            try {
                List<ServicePackageDTO.ServiceItem> services = objectMapper.readValue(
                    entity.getIncludedServices(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, ServicePackageDTO.ServiceItem.class)
                );
                dto.setIncludedServices(services);
            } catch (JsonProcessingException e) {
                log.error("Error parsing included services JSON: {}", e.getMessage());
            }
        }

        return dto;
    }

    /**
     * DTO转实体
     */
    private ServicePackage dtoToEntity(ServicePackageDTO dto) {
        ServicePackage entity = new ServicePackage();
        entity.setId(dto.getId());
        entity.setTenantId(dto.getTenantId());
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setIcon(dto.getIcon());
        entity.setColor(dto.getColor());
        entity.setOriginalPrice(dto.getOriginalPrice());
        entity.setPackagePrice(dto.getPackagePrice());
        entity.setDiscountPercentage(dto.getDiscountPercentage());
        entity.setValidityDays(dto.getValidityDays());
        entity.setMaxSharedUsers(dto.getMaxSharedUsers());
        entity.setTerms(dto.getTerms());
        entity.setStatus(dto.getStatus());
        entity.setCreatedAt(dto.getCreatedAt());
        entity.setUpdatedAt(dto.getUpdatedAt());

        // 将 includedServices 转为 JSON
        if (dto.getIncludedServices() != null && !dto.getIncludedServices().isEmpty()) {
            try {
                String servicesJson = objectMapper.writeValueAsString(dto.getIncludedServices());
                entity.setIncludedServices(servicesJson);
            } catch (JsonProcessingException e) {
                log.error("Error converting included services to JSON: {}", e.getMessage());
            }
        }

        return entity;
    }
}