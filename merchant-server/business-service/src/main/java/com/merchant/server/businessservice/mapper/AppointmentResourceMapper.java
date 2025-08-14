package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.AppointmentResource;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

/**
 * 预约资源关联Mapper
 * SQL语句定义在对应的XML文件中
 */
@Mapper
public interface AppointmentResourceMapper {
    
    /**
     * 插入单个预约资源关联
     * @param resource 预约资源关联实体
     * @return 影响的行数
     */
    int insert(AppointmentResource resource);
    
    /**
     * 批量插入预约资源关联
     * @param resources 预约资源关联列表
     * @return 影响的行数
     */
    int batchInsert(@Param("list") List<AppointmentResource> resources);
    
    /**
     * 根据预约ID查询所有关联资源
     * @param appointmentId 预约ID
     * @return 资源列表
     */
    List<AppointmentResource> selectByAppointmentId(@Param("appointmentId") Long appointmentId);
    
    /**
     * 批量查询多个预约的资源（用于列表查询性能优化）
     * @param appointmentIds 预约ID列表
     * @return 资源列表
     */
    List<AppointmentResource> selectByAppointmentIds(@Param("appointmentIds") List<Long> appointmentIds);
    
    /**
     * 根据资源ID和日期查询相关预约
     * @param resourceId 资源ID
     * @param date 日期
     * @return 预约资源列表
     */
    List<AppointmentResource> selectByResourceIdAndDate(@Param("resourceId") Long resourceId, 
                                                        @Param("date") String date);
    
    /**
     * 删除预约的所有资源关联
     * @param appointmentId 预约ID
     * @return 影响的行数
     */
    int deleteByAppointmentId(@Param("appointmentId") Long appointmentId);
    
    /**
     * 更新主要资源标记
     * @param appointmentId 预约ID
     * @param resourceId 资源ID
     * @param isPrimary 是否为主要资源
     * @return 影响的行数
     */
    int updatePrimary(@Param("appointmentId") Long appointmentId, 
                     @Param("resourceId") Long resourceId, 
                     @Param("isPrimary") Boolean isPrimary);
    
    /**
     * 检查资源在指定时间是否已被预约
     * @param resourceId 资源ID
     * @param date 日期
     * @param time 时间
     * @param excludeAppointmentId 排除的预约ID（可选，用于更新时排除自己）
     * @return 是否已被预约
     */
    boolean isResourceBooked(@Param("resourceId") Long resourceId,
                            @Param("date") String date,
                            @Param("time") String time,
                            @Param("excludeAppointmentId") Long excludeAppointmentId);
}