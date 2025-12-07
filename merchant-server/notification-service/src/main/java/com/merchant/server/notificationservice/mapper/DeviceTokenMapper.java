package com.merchant.server.notificationservice.mapper;

import com.merchant.server.notificationservice.entity.DeviceToken;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 设备Token Mapper
 */
@Mapper
public interface DeviceTokenMapper {

    /**
     * 根据token查找设备
     */
    DeviceToken findByToken(@Param("token") String token);

    /**
     * 获取用户的所有有效设备token
     */
    List<DeviceToken> findActiveByUserId(@Param("userId") Long userId);

    /**
     * 获取租户下所有有效设备token
     */
    List<DeviceToken> findActiveByTenantId(@Param("tenantId") Long tenantId);

    /**
     * 插入设备token
     */
    void insert(DeviceToken deviceToken);

    /**
     * 更新设备token
     */
    void updateById(DeviceToken deviceToken);

    /**
     * 将token标记为失效
     */
    int deactivateToken(@Param("token") String token);

    /**
     * 将用户的所有token标记为失效
     */
    int deactivateAllByUserId(@Param("userId") Long userId);

    /**
     * 将用户的其他token标记为失效（排除指定ID）
     */
    int deactivateOtherTokens(@Param("userId") Long userId, @Param("excludeId") Long excludeId);

    /**
     * 将用户同平台的其他token标记为失效（排除指定ID）
     * 这样用户可以在多个平台同时保持活跃的token
     */
    int deactivateOtherTokensByPlatform(@Param("userId") Long userId, @Param("platform") String platform, @Param("excludeId") Long excludeId);

    /**
     * 将用户同平台的所有token标记为失效
     */
    int deactivateAllByUserIdAndPlatform(@Param("userId") Long userId, @Param("platform") String platform);

    /**
     * 更新最后使用时间
     */
    int updateLastUsedAt(@Param("id") Long id);
}
