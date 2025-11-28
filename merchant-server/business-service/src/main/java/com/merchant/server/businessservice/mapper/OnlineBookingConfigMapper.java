package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.OnlineBookingConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface OnlineBookingConfigMapper {

    /**
     * 根据租户ID查询配置
     */
    OnlineBookingConfig findByTenantId(@Param("tenantId") Long tenantId);

    /**
     * 根据预约页面 slug 查询配置
     */
    OnlineBookingConfig findByBookingPageSlug(@Param("slug") String slug);

    /**
     * 查找所有启用了 Google Business 集成的配置
     */
    List<OnlineBookingConfig> findAllGoogleEnabled();

    /**
     * 查找所有启用了在线预约的配置
     */
    List<OnlineBookingConfig> findAllEnabled();

    /**
     * 插入配置
     */
    void insert(OnlineBookingConfig config);

    /**
     * 更新配置
     */
    void update(OnlineBookingConfig config);

    /**
     * 删除配置
     */
    void deleteByTenantId(@Param("tenantId") Long tenantId);

    /**
     * 检查租户是否已有配置
     */
    boolean existsByTenantId(@Param("tenantId") Long tenantId);
}
