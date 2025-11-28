package com.merchant.server.businessservice.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * 公开可用时间槽DTO - 用于客户选择预约时间
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicTimeSlotDTO {

    private LocalDate date;
    private List<TimeSlot> slots;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeSlot {
        private LocalTime startTime;
        private LocalTime endTime;
        private List<AvailableResource> availableResources;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AvailableResource {
        private Long resourceId;
        private String resourceName;
        private String avatar;
    }
}
