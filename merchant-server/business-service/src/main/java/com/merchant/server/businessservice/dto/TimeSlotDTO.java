package com.merchant.server.businessservice.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * 时间段DTO
 */
@Data
public class TimeSlotDTO {

    private Long resourceId;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    private Integer durationMinutes;

    private Boolean isPreferred; // 是否是客户偏好的技师

    private String skillLevel; // 技师技能等级

    private Double rating; // 技师评分

    private String resourceName; // 技师名称（需要关联查询）
}
