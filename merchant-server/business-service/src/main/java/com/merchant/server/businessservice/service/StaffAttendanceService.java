package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.entity.StaffAttendance;
import com.merchant.server.businessservice.mapper.StaffAttendanceMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * 员工签到签退服务
 */
@Slf4j
@Service
public class StaffAttendanceService {

    @Autowired
    private StaffAttendanceMapper staffAttendanceMapper;

    /**
     * 保存或更新签到签退记录
     * 如果当天已有记录则更新，否则新增
     */
    @Transactional
    public StaffAttendance saveOrUpdate(StaffAttendance staffAttendance) {
        // 检查是否已存在记录
        StaffAttendance existing = staffAttendanceMapper.findByResourceIdAndDate(
                staffAttendance.getResourceId(),
                staffAttendance.getAttendanceDate()
        );

        if (existing != null) {
            // 更新现有记录
            existing.setCheckInTime(staffAttendance.getCheckInTime());
            existing.setCheckOutTime(staffAttendance.getCheckOutTime());
            existing.setNotes(staffAttendance.getNotes());
            staffAttendanceMapper.update(existing);
            log.debug("Updated staff attendance record: resourceId={}, date={}",
                    staffAttendance.getResourceId(), staffAttendance.getAttendanceDate());
            return existing;
        } else {
            // 新增记录
            staffAttendanceMapper.insert(staffAttendance);
            log.debug("Created new staff attendance record: resourceId={}, date={}",
                    staffAttendance.getResourceId(), staffAttendance.getAttendanceDate());
            return staffAttendance;
        }
    }

    /**
     * 根据ID查询签到记录
     */
    public StaffAttendance getById(Long id) {
        return staffAttendanceMapper.findById(id);
    }

    /**
     * 根据资源ID和日期查询签到记录
     */
    public StaffAttendance getByResourceIdAndDate(Long resourceId, LocalDate attendanceDate) {
        return staffAttendanceMapper.findByResourceIdAndDate(resourceId, attendanceDate);
    }

    /**
     * 根据租户ID和日期查询所有员工的签到记录
     */
    public List<StaffAttendance> getByTenantIdAndDate(Long tenantId, LocalDate attendanceDate) {
        return staffAttendanceMapper.findByTenantIdAndDate(tenantId, attendanceDate);
    }

    /**
     * 根据资源ID和日期范围查询签到记录
     */
    public List<StaffAttendance> getByResourceIdAndDateRange(Long resourceId, LocalDate startDate, LocalDate endDate) {
        return staffAttendanceMapper.findByResourceIdAndDateRange(resourceId, startDate, endDate);
    }

    /**
     * 删除签到记录
     */
    @Transactional
    public boolean deleteByResourceIdAndDate(Long resourceId, LocalDate attendanceDate) {
        int rows = staffAttendanceMapper.deleteByResourceIdAndDate(resourceId, attendanceDate);
        if (rows > 0) {
            log.debug("Deleted staff attendance record: resourceId={}, date={}", resourceId, attendanceDate);
            return true;
        }
        return false;
    }
}
