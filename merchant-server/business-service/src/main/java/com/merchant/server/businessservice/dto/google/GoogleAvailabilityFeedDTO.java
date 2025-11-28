package com.merchant.server.businessservice.dto.google;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Google Availability Feed DTO
 * 用于向 Google 提供可用性数据
 * https://developers.google.com/maps-booking/reference/feeds/availability
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleAvailabilityFeedDTO {

    /**
     * Feed 元数据
     */
    @JsonProperty("metadata")
    private FeedMetadata metadata;

    /**
     * 可用性数据
     */
    @JsonProperty("service_availability")
    private List<ServiceAvailability> serviceAvailability;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FeedMetadata {
        /**
         * 处理指令
         * PROCESS_INCREMENTAL, PROCESS_FULL
         */
        @JsonProperty("processing_instruction")
        private String processingInstruction;

        /**
         * 分片ID (用于增量更新)
         */
        @JsonProperty("shard_number")
        private Integer shardNumber;

        /**
         * 总分片数
         */
        @JsonProperty("total_shards")
        private Integer totalShards;

        /**
         * Feed 生成时间
         */
        @JsonProperty("generation_timestamp")
        private String generationTimestamp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceAvailability {
        /**
         * 商户ID
         */
        @JsonProperty("merchant_id")
        private String merchantId;

        /**
         * 服务ID
         */
        @JsonProperty("service_id")
        private String serviceId;

        /**
         * 可用时间段列表
         */
        @JsonProperty("availability")
        private List<Availability> availability;

        /**
         * 资源可用性（如员工）
         */
        @JsonProperty("resources")
        private Resources resources;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Availability {
        /**
         * 开始时间 (RFC3339 格式)
         */
        @JsonProperty("start_time")
        private String startTime;

        /**
         * 时长（秒）
         */
        @JsonProperty("duration")
        private Long duration;

        /**
         * 可用位置数
         */
        @JsonProperty("spots_open")
        private Integer spotsOpen;

        /**
         * 总位置数
         */
        @JsonProperty("spots_total")
        private Integer spotsTotal;

        /**
         * 可用性标签 (用于标识特定的可用性类型)
         */
        @JsonProperty("availability_tag")
        private String availabilityTag;

        /**
         * 资源配置
         */
        @JsonProperty("resources")
        private SlotResources resources;

        /**
         * 支付选项
         */
        @JsonProperty("payment_option_id")
        private List<String> paymentOptionIds;

        /**
         * 循环规则（用于定义重复时间段）
         */
        @JsonProperty("recurrence")
        private Recurrence recurrence;

        /**
         * 排除的时间段（用于循环规则）
         */
        @JsonProperty("schedule_exception")
        private List<ScheduleException> scheduleExceptions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SlotResources {
        /**
         * 员工ID
         */
        @JsonProperty("staff_id")
        private String staffId;

        /**
         * 员工名称
         */
        @JsonProperty("staff_name")
        private String staffName;

        /**
         * 房间ID
         */
        @JsonProperty("room_id")
        private String roomId;

        /**
         * 房间名称
         */
        @JsonProperty("room_name")
        private String roomName;

        /**
         * 聚会人数（用于餐厅预订）
         */
        @JsonProperty("party_size")
        private Integer partySize;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Resources {
        /**
         * 员工资源
         */
        @JsonProperty("staff")
        private List<Staff> staff;

        /**
         * 房间资源
         */
        @JsonProperty("room")
        private List<Room> room;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Staff {
        /**
         * 员工ID
         */
        @JsonProperty("staff_id")
        private String staffId;

        /**
         * 员工名称
         */
        @JsonProperty("name")
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Room {
        /**
         * 房间ID
         */
        @JsonProperty("room_id")
        private String roomId;

        /**
         * 房间名称
         */
        @JsonProperty("name")
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Recurrence {
        /**
         * 重复类型
         * RECURRENCE_TYPE_UNSPECIFIED, REPEAT_DAILY, REPEAT_WEEKLY, REPEAT_MONTHLY
         */
        @JsonProperty("repeat_type")
        private String repeatType;

        /**
         * 重复间隔
         */
        @JsonProperty("repeat_count")
        private Integer repeatCount;

        /**
         * 每周重复的星期几 (1=周一, 7=周日)
         */
        @JsonProperty("repeat_day_of_week")
        private List<Integer> repeatDayOfWeek;

        /**
         * 重复结束时间
         */
        @JsonProperty("repeat_until_time")
        private String repeatUntilTime;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScheduleException {
        /**
         * 排除的时间范围
         */
        @JsonProperty("time_range")
        private TimeRange timeRange;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeRange {
        /**
         * 开始时间
         */
        @JsonProperty("begin")
        private String begin;

        /**
         * 结束时间
         */
        @JsonProperty("end")
        private String end;
    }
}
