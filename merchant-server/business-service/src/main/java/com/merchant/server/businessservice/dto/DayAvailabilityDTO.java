package com.merchant.server.businessservice.dto;

import lombok.Data;
import java.util.List;

/**
 * 一天的可用性DTO
 * 包含一天的所有时间段
 */
@Data
public class DayAvailabilityDTO {

    private Integer dayOfWeek;  // 1-7 (周一到周日)

    private String dayName;  // "Monday", "Tuesday"...

    private List<TimeSegmentDTO> segments;  // 该天的所有时间段
}
