package com.merchant.server.analyticsservice.dto;

import lombok.Data;
import java.time.LocalDate;

/**
 * 分析查询DTO
 */
@Data
public class AnalyticsQueryDTO {
    
    private Long tenantId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String timePeriod; // 7days, 30days, 6months, 1year
    private String dataType; // revenue, service, staff, customer
    
    // 构造方法，根据时间周期自动设置开始和结束日期
    public void setTimePeriodAndCalculateDates(String timePeriod) {
        this.timePeriod = timePeriod;
        LocalDate now = LocalDate.now();
        
        switch (timePeriod) {
            case "7days":
                this.startDate = now.minusDays(6);
                this.endDate = now;
                break;
            case "30days":
                this.startDate = now.minusDays(29);
                this.endDate = now;
                break;
            case "6months":
                this.startDate = now.minusMonths(6);
                this.endDate = now;
                break;
            case "1year":
                this.startDate = now.minusYears(1);
                this.endDate = now;
                break;
            default:
                // 默认30天
                this.startDate = now.minusDays(29);
                this.endDate = now;
        }
    }
}