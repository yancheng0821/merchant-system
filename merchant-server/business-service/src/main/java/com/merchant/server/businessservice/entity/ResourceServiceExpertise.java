package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 技师服务专长关联表
 * 明确技师擅长的服务项目和技能等级
 */
@Data
public class ResourceServiceExpertise {

    private Long id;

    private Long resourceId;

    private Long serviceId;

    private SkillLevel skillLevel = SkillLevel.INTERMEDIATE; // 技能等级

    private Integer yearsExperience; // 从业年限

    private String certification; // 相关认证

    private Boolean isPreferred = false; // 是否首选技师

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    // 关联的Resource和Service信息
    private Resource resource;
    private Service service;

    /**
     * 技能等级枚举
     */
    public enum SkillLevel {
        BEGINNER,     // 初学者
        INTERMEDIATE, // 中级
        EXPERT,       // 专家
        MASTER        // 大师
    }

    /**
     * 获取技能等级的中文名称
     */
    public String getSkillLevelName() {
        if (skillLevel == null) {
            return "";
        }

        switch (skillLevel) {
            case BEGINNER: return "初学者";
            case INTERMEDIATE: return "中级";
            case EXPERT: return "专家";
            case MASTER: return "大师";
            default: return "";
        }
    }

    /**
     * 获取技能等级的数值分数(用于排序)
     */
    public Integer getSkillScore() {
        if (skillLevel == null) {
            return 0;
        }

        switch (skillLevel) {
            case BEGINNER: return 1;
            case INTERMEDIATE: return 2;
            case EXPERT: return 3;
            case MASTER: return 4;
            default: return 0;
        }
    }
}
