package com.merchant.server.businessservice.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/**
 * 可用性查询响应
 */
@Data
public class AvailabilityResponseDTO {

    private Long serviceId;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;

    private List<TimeSlotDTO> availableSlots;

    private Integer totalSlots;

    private String message;
}
