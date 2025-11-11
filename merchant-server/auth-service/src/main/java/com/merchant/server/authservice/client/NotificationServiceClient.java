package com.merchant.server.authservice.client;

import com.merchant.server.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "notification-service")
public interface NotificationServiceClient {

    /**
     * 初始化商户的默认通知模板
     * 注意：此接口在NotificationController中，不需要权限验证
     */
    @PostMapping("/api/notification/templates/init")
    ApiResponse<String> initDefaultTemplates(@RequestParam("tenantId") Long tenantId,
                                            @RequestParam(value = "language", defaultValue = "en") String language);
}
