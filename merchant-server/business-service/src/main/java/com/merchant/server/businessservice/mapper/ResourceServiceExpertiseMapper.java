package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.ResourceServiceExpertise;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ResourceServiceExpertiseMapper {

    /**
     * 根据资源ID和服务ID查询专长
     */
    ResourceServiceExpertise findByResourceIdAndServiceId(
        @Param("resourceId") Long resourceId,
        @Param("serviceId") Long serviceId
    );

    /**
     * 根据资源ID查询所有专长
     */
    List<ResourceServiceExpertise> findByResourceId(@Param("resourceId") Long resourceId);

    /**
     * 根据服务ID查询擅长该服务的所有技师
     */
    List<ResourceServiceExpertise> findByServiceId(@Param("serviceId") Long serviceId);

    /**
     * 根据服务ID和技能等级查询技师
     */
    List<ResourceServiceExpertise> findByServiceIdAndSkillLevel(
        @Param("serviceId") Long serviceId,
        @Param("skillLevel") String skillLevel
    );

    /**
     * 查询服务的首选技师
     */
    List<ResourceServiceExpertise> findPreferredByServiceId(@Param("serviceId") Long serviceId);

    /**
     * 插入专长记录
     */
    void insert(ResourceServiceExpertise expertise);

    /**
     * 批量插入专长记录
     */
    void batchInsert(@Param("expertiseList") List<ResourceServiceExpertise> expertiseList);

    /**
     * 更新专长记录
     */
    void update(ResourceServiceExpertise expertise);

    /**
     * 删除专长记录
     */
    void deleteByResourceIdAndServiceId(
        @Param("resourceId") Long resourceId,
        @Param("serviceId") Long serviceId
    );

    /**
     * 删除资源的所有专长记录
     */
    void deleteByResourceId(@Param("resourceId") Long resourceId);
}
