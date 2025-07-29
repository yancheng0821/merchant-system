package com.merchant.server.notificationservice.controller;

import com.merchant.server.notificationservice.service.NotificationHealthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/notification/health")
public class NotificationHealthController {
    
    @Autowired
    private NotificationHealthService healthService;
    
    /**
     * 获取通知服务健康状态
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getHealth() {
        try {
            Map<String, Object> health = healthService.checkHealth();
            return ResponseEntity.ok(health);
        } catch (Exception e) {
            log.error("获取健康状态失败", e);
            Map<String, Object> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * 发送测试短信
     */
    @PostMapping("/test/sms")
    public ResponseEntity<Map<String, Object>> sendTestSms(@RequestParam String phoneNumber) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            boolean success = healthService.sendTestSms(phoneNumber);
            result.put("success", success);
            result.put("message", success ? "测试短信发送成功" : "测试短信发送失败");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("发送测试短信失败", e);
            result.put("success", false);
            result.put("message", "发送测试短信异常：" + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }
    
    /**
     * 发送测试邮件
     */
    @PostMapping("/test/email")
    public ResponseEntity<Map<String, Object>> sendTestEmail(@RequestParam String email) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            boolean success = healthService.sendTestEmail(email);
            result.put("success", success);
            result.put("message", success ? "测试邮件发送成功" : "测试邮件发送失败");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("发送测试邮件失败", e);
            result.put("success", false);
            result.put("message", "发送测试邮件异常：" + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }
}