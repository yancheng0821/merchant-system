package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * 技师技能评分统计表
 * 由客户评价累积,按服务类型统计技师评分
 */
@Data
public class ResourceSkillRating {

    private Long id;

    private Long resourceId;

    private Long serviceId;

    private Integer totalAppointments = 0; // 总预约次数

    private BigDecimal avgRating = BigDecimal.ZERO; // 平均评分(0.00-5.00)

    private Integer totalRatingPoints = 0; // 总评分点数

    private Integer ratingCount = 0; // 评分次数

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastRatedAt; // 最后评分时间

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    // 关联的Resource和Service信息
    private Resource resource;
    private Service service;

    /**
     * 添加一个新评分并更新统计
     */
    public void addRating(int rating) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        this.totalRatingPoints += rating;
        this.ratingCount++;
        this.lastRatedAt = LocalDateTime.now(ZoneOffset.UTC);

        // 重新计算平均评分
        recalculateAvgRating();
    }

    /**
     * 增加预约次数
     */
    public void incrementAppointmentCount() {
        this.totalAppointments++;
    }

    /**
     * 重新计算平均评分
     */
    private void recalculateAvgRating() {
        if (ratingCount == 0) {
            this.avgRating = BigDecimal.ZERO;
        } else {
            this.avgRating = BigDecimal.valueOf(totalRatingPoints)
                .divide(BigDecimal.valueOf(ratingCount), 2, RoundingMode.HALF_UP);
        }
    }

    /**
     * 获取评分的星级显示
     */
    public String getRatingStars() {
        if (avgRating == null || avgRating.compareTo(BigDecimal.ZERO) == 0) {
            return "☆☆☆☆☆";
        }

        int fullStars = avgRating.intValue();
        boolean hasHalfStar = avgRating.subtract(BigDecimal.valueOf(fullStars))
            .compareTo(BigDecimal.valueOf(0.5)) >= 0;

        StringBuilder stars = new StringBuilder();
        for (int i = 0; i < fullStars && i < 5; i++) {
            stars.append("⭐");
        }
        if (hasHalfStar && fullStars < 5) {
            stars.append("✨");
            fullStars++;
        }
        for (int i = fullStars; i < 5; i++) {
            stars.append("☆");
        }

        return stars.toString();
    }

    /**
     * 获取评分质量等级
     */
    public String getRatingLevel() {
        if (avgRating == null || avgRating.compareTo(BigDecimal.ZERO) == 0) {
            return "未评分";
        }

        double rating = avgRating.doubleValue();
        if (rating >= 4.8) {
            return "卓越";
        } else if (rating >= 4.5) {
            return "优秀";
        } else if (rating >= 4.0) {
            return "良好";
        } else if (rating >= 3.5) {
            return "一般";
        } else {
            return "需改进";
        }
    }

    /**
     * 判断是否为高评分(4.0及以上)
     */
    public boolean isHighRated() {
        return avgRating != null && avgRating.compareTo(BigDecimal.valueOf(4.0)) >= 0;
    }

    /**
     * 判断评分是否可信(至少5次评价)
     */
    public boolean isReliableRating() {
        return ratingCount != null && ratingCount >= 5;
    }

    /**
     * 获取评分可信度描述
     */
    public String getReliabilityDescription() {
        if (ratingCount == null || ratingCount == 0) {
            return "暂无评价";
        } else if (ratingCount < 5) {
            return "评价较少";
        } else if (ratingCount < 20) {
            return "评价适中";
        } else {
            return "评价充分";
        }
    }

    /**
     * 获取完成率(已评分/总预约)
     */
    public BigDecimal getReviewRate() {
        if (totalAppointments == null || totalAppointments == 0) {
            return BigDecimal.ZERO;
        }

        return BigDecimal.valueOf(ratingCount)
            .divide(BigDecimal.valueOf(totalAppointments), 2, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));
    }
}
