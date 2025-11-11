package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.dto.SendVerificationCodeRequest;
import com.merchant.server.businessservice.dto.VerifyCodeRequest;
import com.merchant.server.businessservice.dto.VerificationCodeResponse;
import com.merchant.server.businessservice.service.VerificationCodeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * 验证码控制器
 */
@RestController
@RequestMapping("/api/business/verification")
@Slf4j
public class VerificationCodeController {

    @Autowired
    private VerificationCodeService verificationCodeService;

    /**
     * 发送验证码
     */
    @PostMapping("/send")
    public ResponseEntity<VerificationCodeResponse> sendVerificationCode(
            @RequestHeader(value = "Accept-Language", required = false) String lang,
            @RequestBody SendVerificationCodeRequest request,
            HttpServletRequest httpRequest) {
        try {
            // 设置语言环境
            if (lang != null && !lang.isEmpty()) {
                LocaleContextHolder.setLocale(Locale.forLanguageTag(lang));
            }

            // 设置IP地址和User Agent
            request.setIpAddress(getClientIp(httpRequest));
            request.setUserAgent(httpRequest.getHeader("User-Agent"));

            log.info("Sending verification code - tenantId: {}, businessType: {}, recipient: {}, ip: {}, lang: {}",
                    request.getTenantId(), request.getBusinessType(), request.getRecipient(), request.getIpAddress(), lang);

            VerificationCodeResponse response = verificationCodeService.sendVerificationCode(request);

            if (response.getSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
        } catch (IllegalStateException e) {
            log.warn("Failed to send verification code: {}", e.getMessage());
            return ResponseEntity.badRequest().body(VerificationCodeResponse.failure(e.getMessage()));
        } catch (Exception e) {
            log.error("Error sending verification code", e);
            return ResponseEntity.internalServerError().body(
                    VerificationCodeResponse.failure("Failed to send verification code: " + e.getMessage())
            );
        }
    }

    /**
     * 验证验证码
     */
    @PostMapping("/verify")
    public ResponseEntity<VerificationCodeResponse> verifyCode(
            @RequestHeader(value = "Accept-Language", required = false) String lang,
            @RequestBody VerifyCodeRequest request,
            HttpServletRequest httpRequest) {
        try {
            // 设置语言环境
            if (lang != null && !lang.isEmpty()) {
                LocaleContextHolder.setLocale(Locale.forLanguageTag(lang));
            }

            // 设置IP地址
            request.setIpAddress(getClientIp(httpRequest));

            log.info("Verifying code - verificationId: {}, lang: {}", request.getVerificationId(), lang);

            VerificationCodeResponse response = verificationCodeService.verifyCode(request);

            if (response.getSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            log.error("Error verifying code", e);
            return ResponseEntity.internalServerError().body(
                    VerificationCodeResponse.failure("Verification failed: " + e.getMessage())
            );
        }
    }

    /**
     * 获取客户端IP地址
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // 取第一个IP
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
