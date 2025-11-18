package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.StaffAttendance;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

/**
 * 员工签到签退记录Mapper
 */
@Mapper
public interface StaffAttendanceMapper {

    /**
     * 根据ID查询签到记录
     */
    StaffAttendance findById(@Param("id") Long id);

    /**
     * 根据资源ID和日期查询签到记录
     */
    StaffAttendance findByResourceIdAndDate(
            @Param("resourceId") Long resourceId,
            @Param("attendanceDate") LocalDate attendanceDate
    );

    /**
     * 根据租户ID和日期查询所有员工的签到记录
     */
    List<StaffAttendance> findByTenantIdAndDate(
            @Param("tenantId") Long tenantId,
            @Param("attendanceDate") LocalDate attendanceDate
    );

    /**
     * 根据资源ID和日期范围查询签到记录
     */
    List<StaffAttendance> findByResourceIdAndDateRange(
            @Param("resourceId") Long resourceId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * 插入签到记录
     */
    int insert(StaffAttendance staffAttendance);

    /**
     * 更新签到记录
     */
    int update(StaffAttendance staffAttendance);

    /**
     * 删除签到记录
     */
    int deleteById(@Param("id") Long id);

    /**
     * 根据资源ID和日期删除签到记录
     */
    int deleteByResourceIdAndDate(
            @Param("resourceId") Long resourceId,
            @Param("attendanceDate") LocalDate attendanceDate
    );

    /**
     * 更新汇总发送状态
     */
    int updateSummarySentStatus(
            @Param("resourceId") Long resourceId,
            @Param("attendanceDate") LocalDate attendanceDate,
            @Param("summarySentBy") String summarySentBy
    );
}
