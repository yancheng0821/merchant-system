package com.merchant.server.businessservice.dto.pos;

import lombok.Data;
import lombok.Builder;
import java.time.LocalDateTime;

/**
 * POS终端状态
 */
@Data
@Builder
public class POSTerminalStatus {
    private String terminalId;
    private String status; // online, offline, busy, error
    private boolean connected;
    private String firmwareVersion;
    private LocalDateTime lastHeartbeat;
    private String batteryLevel;
    private String networkStatus;
}