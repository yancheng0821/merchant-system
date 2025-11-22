package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * 员工签到签退记录实体
 */
@Data
public class StaffAttendance {

    private Long id;

    private Long tenantId;

    private Long resourceId;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate attendanceDate;

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime checkInTime;

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime checkOutTime;

    // 调整后的多个时间段（用于保留休息时间）
    // 格式：[{"start":"09:00","end":"12:00"},{"start":"14:00","end":"20:00"}]
    private List<TimePeriod> timePeriods;

    private String notes;

    private Long createdBy;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    // 汇总发送状态字段
    private Integer summarySent;  // 0-未发送 1-已发送

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime summarySentAt;  // 汇总发送时间

    private String summarySentBy;  // 发送方式: manual-手动发送 scheduled-定时任务发送

    /**
     * 时间段内部类
     */
    @Data
    public static class TimePeriod {
        private String start;  // 格式: "HH:mm"
        private String end;    // 格式: "HH:mm"

        public TimePeriod() {}

        public TimePeriod(String start, String end) {
            this.start = start;
            this.end = end;
        }
    }
}
