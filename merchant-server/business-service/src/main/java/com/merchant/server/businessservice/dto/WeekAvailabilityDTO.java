package com.merchant.server.businessservice.dto;

import lombok.Data;
import java.util.List;

/**
 * 一周的排班DTO
 * 包含一周7天的完整排班信息
 */
@Data
public class WeekAvailabilityDTO {

    private Long resourceId;

    private String resourceName;

    private List<DayAvailabilityDTO> weekDays;  // 7天的排班
}
