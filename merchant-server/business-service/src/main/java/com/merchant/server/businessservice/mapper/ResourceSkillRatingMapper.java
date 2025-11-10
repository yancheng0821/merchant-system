package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.ResourceSkillRating;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ResourceSkillRatingMapper {

    /**
     * 根据资源ID和服务ID查询评分
     */
    ResourceSkillRating findByResourceIdAndServiceId(
        @Param("resourceId") Long resourceId,
        @Param("serviceId") Long serviceId
    );

    /**
     * 根据资源ID查询所有评分
     */
    List<ResourceSkillRating> findByResourceId(@Param("resourceId") Long resourceId);

    /**
     * 根据服务ID查询所有技师评分(按平均评分排序)
     */
    List<ResourceSkillRating> findByServiceIdOrderByRating(@Param("serviceId") Long serviceId);

    /**
     * 查询高评分技师(4.0及以上)
     */
    List<ResourceSkillRating> findHighRatedByServiceId(@Param("serviceId") Long serviceId);

    /**
     * 插入评分记录
     */
    void insert(ResourceSkillRating rating);

    /**
     * 更新评分记录
     */
    void update(ResourceSkillRating rating);

    /**
     * 删除评分记录
     */
    void deleteByResourceIdAndServiceId(
        @Param("resourceId") Long resourceId,
        @Param("serviceId") Long serviceId
    );

    /**
     * 删除资源的所有评分记录
     */
    void deleteByResourceId(@Param("resourceId") Long resourceId);

    /**
     * 检查评分记录是否存在
     */
    boolean existsByResourceIdAndServiceId(
        @Param("resourceId") Long resourceId,
        @Param("serviceId") Long serviceId
    );
}
