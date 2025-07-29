package com.merchant.server.notificationservice.controller;

import com.merchant.server.notificationservice.service.SmsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/notification/test")
public class SmsTestController {
    
    @Autowired
    private SmsService smsService;
    
    /**
     * 测试发送短信
     * 使用方法：POST /api/notification/test/sms
     * 请求体：{"phoneNumber": "+8613800138000", "message": "测试短信内容"}
     */
    @PostMapping("/sms")
    public ResponseEntity<Map<String, Object>> testSms(@RequestBody Map<String, String> request) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String phoneNumber = request.get("phoneNumber");
            String message = request.get("message");
            
            if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
                result.put("success", false);
                result.put("message", "手机号码不能为空");
                return ResponseEntity.badRequest().body(result);
            }
            
            if (message == null || message.trim().isEmpty()) {
                message = "这是一条来自美容院预约系统的测试短信。如果您收到此短信，说明短信服务配置正确。";
            }
            
            log.info("开始测试发送短信到：{}", phoneNumber);
            
            boolean success = smsService.sendSms(phoneNumber, message);
            
            result.put("success", success);
            result.put("phoneNumber", phoneNumber);
            result.put("message", message);
            result.put("result", success ? "短信发送成功" : "短信发送失败");
            
            if (success) {
                log.info("测试短信发送成功：{}", phoneNumber);
            } else {
                log.error("测试短信发送失败：{}", phoneNumber);
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("测试短信发送异常", e);
            result.put("success", false);
            result.put("message", "发送异常：" + e.getMessage());
            result.put("error", e.getClass().getSimpleName());
            return ResponseEntity.status(500).body(result);
        }
    }
    
    /**
     * 快速测试发送短信（GET方式，方便浏览器测试）
     * 使用方法：GET /api/notification/test/sms/quick?phoneNumber=+8613800138000&message=测试内容
     */
    @GetMapping("/sms/quick")
    public ResponseEntity<Map<String, Object>> testSmsQuick(
            @RequestParam String phoneNumber,
            @RequestParam(required = false) String message) {
        
        Map<String, String> request = new HashMap<>();
        request.put("phoneNumber", phoneNumber);
        if (message != null) {
            request.put("message", message);
        }
        
        return testSms(request);
    }
    
    /**
     * 获取当前短信服务配置信息
     */
    @GetMapping("/sms/config")
    public ResponseEntity<Map<String, Object>> getSmsConfig() {
        Map<String, Object> config = new HashMap<>();
        
        try {
            // 这里可以添加一些配置信息的展示，但不要暴露敏感信息
            config.put("service", "AWS SNS");
            config.put("status", "enabled");
            config.put("message", "短信服务已启用，使用AWS SNS");
            
            return ResponseEntity.ok(config);
            
        } catch (Exception e) {
            log.error("获取短信配置失败", e);
            config.put("status", "error");
            config.put("message", "获取配置失败：" + e.getMessage());
            return ResponseEntity.status(500).body(config);
        }
    }
}