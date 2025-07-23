package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.Appointment;
import com.merchant.server.businessservice.entity.AppointmentService;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AppointmentMapper {
    
    /**
     * 根据ID查询预约
     */
    Appointment findById(Long id);
    
    /**
     * 根据租户ID查询所有预约
     */
    List<Appointment> findByTenantId(@Param("tenantId") Long tenantId);
    
    /**
     * 根据预约ID查询预约服务
     */
    List<AppointmentService> findAppointmentServicesByAppointmentId(@Param("appointmentId") Long appointmentId);
    
    /**
     * 根据客户ID和租户ID查询预约
     */
    List<Appointment> findByCustomerIdAndTenantId(@Param("customerId") Long customerId, 
                                                  @Param("tenantId") Long tenantId);
    
    /**
     * 根据客户ID查询预约
     */
    List<Appointment> selectByCustomerId(@Param("customerId") Long customerId, 
                                       @Param("offset") int offset, 
                                       @Param("limit") int limit);
    
    /**
     * 根据客户ID和状态查询预约
     */
    List<Appointment> selectByCustomerIdAndStatus(@Param("customerId") Long customerId, 
                                                @Param("status") String status,
                                                @Param("offset") int offset, 
                                                @Param("limit") int limit);
    
    /**
     * 根据客户ID查询预约历史（按日期倒序）
     */
    List<Appointment> selectCustomerAppointmentHistory(@Param("customerId") Long customerId, 
                                                     @Param("limit") int limit);
    
    /**
     * 统计客户预约数量
     */
    long countByCustomerId(Long customerId);
    
    /**
     * 统计客户已完成预约数量
     */
    long countByCustomerIdAndStatus(@Param("customerId") Long customerId, @Param("status") String status);
    
    /**
     * 统计租户预约数量
     */
    long countByTenantId(Long tenantId);
    
    /**
     * 统计租户待服务预约数量
     */
    long countPendingAppointments(Long tenantId);
    
    /**
     * 获取客户平均评分
     */
    Double getCustomerAverageRating(Long customerId);
    
    /**
     * 插入预约
     */
    int insert(Appointment appointment);
    
    /**
     * 更新预约
     */
    int update(Appointment appointment);
    
    /**
     * 删除预约
     */
    int deleteById(Long id);
    
    /**
     * 查询所有CONFIRMED状态的预约
     */
    List<Appointment> findConfirmedAppointments();
    
    /**
     * 根据日期范围查询预约
     */
    List<Appointment> findAppointmentsByDateRange(@Param("startDate") java.time.LocalDate startDate, 
                                                  @Param("endDate") java.time.LocalDate endDate);
    
    /**
     * 根据时间范围查询预约
     */
    List<Appointment> findAppointmentsByTimeRange(@Param("date") java.time.LocalDate date,
                                                  @Param("startTime") java.time.LocalTime startTime,
                                                  @Param("endTime") java.time.LocalTime endTime);
}