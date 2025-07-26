package com.merchant.server.merchantservice.dto;

import java.util.List;

public class MerchantConfigDTO {
    
    private Long merchantId;
    private List<String> resourceTypes;
    private BusinessHours businessHours;
    private AppointmentSettings appointmentSettings;
    private NotificationSettings notificationSettings;

    // Getters and Setters
    public Long getMerchantId() {
        return merchantId;
    }

    public void setMerchantId(Long merchantId) {
        this.merchantId = merchantId;
    }

    public List<String> getResourceTypes() {
        return resourceTypes;
    }

    public void setResourceTypes(List<String> resourceTypes) {
        this.resourceTypes = resourceTypes;
    }

    public BusinessHours getBusinessHours() {
        return businessHours;
    }

    public void setBusinessHours(BusinessHours businessHours) {
        this.businessHours = businessHours;
    }

    public AppointmentSettings getAppointmentSettings() {
        return appointmentSettings;
    }

    public void setAppointmentSettings(AppointmentSettings appointmentSettings) {
        this.appointmentSettings = appointmentSettings;
    }

    public NotificationSettings getNotificationSettings() {
        return notificationSettings;
    }

    public void setNotificationSettings(NotificationSettings notificationSettings) {
        this.notificationSettings = notificationSettings;
    }
    
    public static class BusinessHours {
        private DaySchedule monday;
        private DaySchedule tuesday;
        private DaySchedule wednesday;
        private DaySchedule thursday;
        private DaySchedule friday;
        private DaySchedule saturday;
        private DaySchedule sunday;

        // Getters and Setters
        public DaySchedule getMonday() { return monday; }
        public void setMonday(DaySchedule monday) { this.monday = monday; }
        public DaySchedule getTuesday() { return tuesday; }
        public void setTuesday(DaySchedule tuesday) { this.tuesday = tuesday; }
        public DaySchedule getWednesday() { return wednesday; }
        public void setWednesday(DaySchedule wednesday) { this.wednesday = wednesday; }
        public DaySchedule getThursday() { return thursday; }
        public void setThursday(DaySchedule thursday) { this.thursday = thursday; }
        public DaySchedule getFriday() { return friday; }
        public void setFriday(DaySchedule friday) { this.friday = friday; }
        public DaySchedule getSaturday() { return saturday; }
        public void setSaturday(DaySchedule saturday) { this.saturday = saturday; }
        public DaySchedule getSunday() { return sunday; }
        public void setSunday(DaySchedule sunday) { this.sunday = sunday; }
        
        public static class DaySchedule {
            private String start;
            private String end;
            private Boolean closed;

            // Getters and Setters
            public String getStart() { return start; }
            public void setStart(String start) { this.start = start; }
            public String getEnd() { return end; }
            public void setEnd(String end) { this.end = end; }
            public Boolean getClosed() { return closed; }
            public void setClosed(Boolean closed) { this.closed = closed; }
        }
    }
    
    public static class AppointmentSettings {
        private Integer advanceBookingDays;
        private Integer cancellationHours;
        private Integer reminderHours;
        private Boolean autoConfirm;

        // Getters and Setters
        public Integer getAdvanceBookingDays() { return advanceBookingDays; }
        public void setAdvanceBookingDays(Integer advanceBookingDays) { this.advanceBookingDays = advanceBookingDays; }
        public Integer getCancellationHours() { return cancellationHours; }
        public void setCancellationHours(Integer cancellationHours) { this.cancellationHours = cancellationHours; }
        public Integer getReminderHours() { return reminderHours; }
        public void setReminderHours(Integer reminderHours) { this.reminderHours = reminderHours; }
        public Boolean getAutoConfirm() { return autoConfirm; }
        public void setAutoConfirm(Boolean autoConfirm) { this.autoConfirm = autoConfirm; }
    }
    
    public static class NotificationSettings {
        private Boolean smsEnabled;
        private Boolean emailEnabled;
        private Boolean pushEnabled;

        // Getters and Setters
        public Boolean getSmsEnabled() { return smsEnabled; }
        public void setSmsEnabled(Boolean smsEnabled) { this.smsEnabled = smsEnabled; }
        public Boolean getEmailEnabled() { return emailEnabled; }
        public void setEmailEnabled(Boolean emailEnabled) { this.emailEnabled = emailEnabled; }
        public Boolean getPushEnabled() { return pushEnabled; }
        public void setPushEnabled(Boolean pushEnabled) { this.pushEnabled = pushEnabled; }
    }
}