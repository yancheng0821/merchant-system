package com.merchant.server.authservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Map;

@FeignClient(name = "business-service")
public interface BusinessServiceClient {

    @PostMapping("/api/business/verification/send")
    ResponseEntity<VerificationCodeResponse> sendVerificationCode(
            @RequestHeader(value = "Accept-Language", required = false) String acceptLanguage,
            @RequestBody SendVerificationCodeRequest request);

    @PostMapping("/api/business/verification/verify")
    ResponseEntity<VerificationCodeResponse> verifyCode(
            @RequestHeader(value = "Accept-Language", required = false) String acceptLanguage,
            @RequestBody VerifyCodeRequest request);

    /**
     * 创建默认 Walk-in 客户
     */
    @PostMapping("/api/business/customers/walk-in")
    Map<String, Object> createWalkInCustomer(@RequestParam("tenantId") Long tenantId);

    /**
     * 为新租户初始化系统通知副本
     */
    @PostMapping("/api/business/notifications/system/init-for-tenant/{tenantId}")
    ResponseEntity<Void> initSystemNotificationCopiesForNewTenant(@PathVariable("tenantId") Long tenantId);

    /**
     * 从模板租户复制会员等级
     */
    @PostMapping("/api/business/membership-tiers/copy-from-template")
    Map<String, Object> copyMembershipTiersFromTemplate(@RequestParam("tenantId") Long tenantId);

    class SendVerificationCodeRequest {
        public Long tenantId;
        public String businessType;
        public String businessId;
        public String recipientType;
        public String recipient;
        public String ipAddress;
        public String userAgent;
        public String metadata;

        public SendVerificationCodeRequest(Long tenantId, String businessType, String recipient, String recipientType) {
            this.tenantId = tenantId;
            this.businessType = businessType;
            this.recipient = recipient;
            this.recipientType = recipientType;
        }

        public SendVerificationCodeRequest(Long tenantId, String businessType, String businessId, String recipient, String recipientType) {
            this.tenantId = tenantId;
            this.businessType = businessType;
            this.businessId = businessId;
            this.recipient = recipient;
            this.recipientType = recipientType;
        }
    }

    class VerifyCodeRequest {
        public String verificationId;
        public String code;
        public String ipAddress;

        public VerifyCodeRequest(String verificationId, String code) {
            this.verificationId = verificationId;
            this.code = code;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    class VerificationCodeResponse {
        public Boolean success;
        public String message;
        public String verificationId;
        public Integer expiresIn;
        public Integer expiresInMinutes;  // 兼容字段
        public Integer remainingAttempts; // 兼容字段
    }
}
