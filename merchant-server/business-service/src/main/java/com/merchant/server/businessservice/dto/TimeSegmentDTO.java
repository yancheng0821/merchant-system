package com.merchant.server.businessservice.dto;

import lombok.Data;

/**
 * 时间段DTO
 * 表示一天中的一个工作时段
 */
@Data
public class TimeSegmentDTO {

    private Long id;  // 如果是编辑模式，需要ID

    private String startTime;  // HH:mm格式，如 "09:00"

    private String endTime;  // HH:mm格式，如 "18:00"

    private Integer segmentOrder;  // 时间段顺序
}
