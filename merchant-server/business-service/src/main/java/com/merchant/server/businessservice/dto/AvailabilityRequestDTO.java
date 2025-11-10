package com.merchant.server.businessservice.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;

/**
 * 可用性查询请求
 */
@Data
public class AvailabilityRequestDTO {

    private Long serviceId;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;

    private Integer serviceDurationMinutes;

    private Long customerId; // 可选，用于个性化推荐

    private String preferredSkillLevel; // 可选，EXPERT, INTERMEDIATE, BEGINNER

    private Boolean requireHighRating; // 可选，是否只要高评分技师
}
