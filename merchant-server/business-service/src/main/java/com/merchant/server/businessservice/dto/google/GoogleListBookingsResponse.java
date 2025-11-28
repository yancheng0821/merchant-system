package com.merchant.server.businessservice.dto.google;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Google ListBookings 响应 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleListBookingsResponse {

    /**
     * 预约列表
     */
    @JsonProperty("bookings")
    private List<GoogleBookingResponseDTO.GoogleBooking> bookings;
}
