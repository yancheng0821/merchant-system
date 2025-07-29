package com.merchant.server.notificationservice.controller;

import com.merchant.server.notificationservice.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/notification/test")
public class EmailTestController {
    
    @Autowired
    private EmailService emailService;
    
    /**
     * 测试发送邮件
     * 使用方法：POST /api/notification/test/email
     * 请求体：{"email": "test@example.com", "subject": "测试主题", "content": "测试内容"}
     */
    @PostMapping("/email")
    public ResponseEntity<Map<String, Object>> testEmail(@RequestBody Map<String, String> request) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String email = request.get("email");
            String subject = request.get("subject");
            String content = request.get("content");
            
            if (email == null || email.trim().isEmpty()) {
                result.put("success", false);
                result.put("message", "邮箱地址不能为空");
                return ResponseEntity.badRequest().body(result);
            }
            
            if (subject == null || subject.trim().isEmpty()) {
                subject = "美容院预约系统 - 测试邮件";
            }
            
            if (content == null || content.trim().isEmpty()) {
                content = generateTestEmailContent();
            }
            
            log.info("开始测试发送邮件到：{}", email);
            
            boolean success = emailService.sendEmail(email, subject, content);
            
            result.put("success", success);
            result.put("email", email);
            result.put("subject", subject);
            result.put("contentLength", content.length());
            result.put("result", success ? "邮件发送成功" : "邮件发送失败");
            result.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            if (success) {
                log.info("测试邮件发送成功：{}", email);
            } else {
                log.error("测试邮件发送失败：{}", email);
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("测试邮件发送异常", e);
            result.put("success", false);
            result.put("message", "发送异常：" + e.getMessage());
            result.put("error", e.getClass().getSimpleName());
            return ResponseEntity.status(500).body(result);
        }
    }
    
    /**
     * 测试发送HTML邮件
     */
    @PostMapping("/email/html")
    public ResponseEntity<Map<String, Object>> testHtmlEmail(@RequestBody Map<String, String> request) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String email = request.get("email");
            String subject = request.get("subject");
            String htmlContent = request.get("content");
            
            if (email == null || email.trim().isEmpty()) {
                result.put("success", false);
                result.put("message", "邮箱地址不能为空");
                return ResponseEntity.badRequest().body(result);
            }
            
            if (subject == null || subject.trim().isEmpty()) {
                subject = "美容院预约系统 - HTML测试邮件";
            }
            
            if (htmlContent == null || htmlContent.trim().isEmpty()) {
                htmlContent = generateTestHtmlEmailContent();
            }
            
            log.info("开始测试发送HTML邮件到：{}", email);
            
            boolean success = emailService.sendHtmlEmail(email, subject, htmlContent);
            
            result.put("success", success);
            result.put("email", email);
            result.put("subject", subject);
            result.put("contentType", "HTML");
            result.put("contentLength", htmlContent.length());
            result.put("result", success ? "HTML邮件发送成功" : "HTML邮件发送失败");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("测试HTML邮件发送异常", e);
            result.put("success", false);
            result.put("message", "发送异常：" + e.getMessage());
            result.put("error", e.getClass().getSimpleName());
            return ResponseEntity.status(500).body(result);
        }
    }
    
    /**
     * 测试批量发送邮件
     */
    @PostMapping("/email/batch")
    public ResponseEntity<Map<String, Object>> testBatchEmail(@RequestBody Map<String, Object> request) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            @SuppressWarnings("unchecked")
            java.util.List<String> emails = (java.util.List<String>) request.get("emails");
            String subject = (String) request.get("subject");
            String content = (String) request.get("content");
            
            if (emails == null || emails.isEmpty()) {
                result.put("success", false);
                result.put("message", "邮箱列表不能为空");
                return ResponseEntity.badRequest().body(result);
            }
            
            if (subject == null || subject.trim().isEmpty()) {
                subject = "美容院预约系统 - 批量测试邮件";
            }
            
            if (content == null || content.trim().isEmpty()) {
                content = "这是一封批量发送的测试邮件。\n\n发送时间：" + 
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            }
            
            String[] emailArray = emails.toArray(new String[0]);
            
            log.info("开始测试批量发送邮件，收件人数量：{}", emailArray.length);
            
            boolean success = emailService.sendEmailToMultiple(emailArray, subject, content);
            
            result.put("success", success);
            result.put("emails", emails);
            result.put("recipientCount", emailArray.length);
            result.put("subject", subject);
            result.put("result", success ? "批量邮件发送成功" : "批量邮件发送失败");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("测试批量邮件发送异常", e);
            result.put("success", false);
            result.put("message", "发送异常：" + e.getMessage());
            result.put("error", e.getClass().getSimpleName());
            return ResponseEntity.status(500).body(result);
        }
    }
    
    /**
     * 快速测试发送邮件（GET方式，方便浏览器测试）
     */
    @GetMapping("/email/quick")
    public ResponseEntity<Map<String, Object>> testEmailQuick(
            @RequestParam String email,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String content) {
        
        Map<String, String> request = new HashMap<>();
        request.put("email", email);
        if (subject != null) {
            request.put("subject", subject);
        }
        if (content != null) {
            request.put("content", content);
        }
        
        return testEmail(request);
    }
    
    /**
     * 获取当前邮件服务配置信息
     */
    @GetMapping("/email/config")
    public ResponseEntity<Map<String, Object>> getEmailConfig() {
        Map<String, Object> config = new HashMap<>();
        
        try {
            config.put("service", "AWS SES");
            config.put("status", "enabled");
            config.put("message", "邮件服务已启用，使用AWS SES");
            config.put("supportedFeatures", java.util.Arrays.asList(
                "HTML邮件", "纯文本邮件", "批量发送", "抄送功能", "自动重试"
            ));
            
            return ResponseEntity.ok(config);
            
        } catch (Exception e) {
            log.error("获取邮件配置失败", e);
            config.put("status", "error");
            config.put("message", "获取配置失败：" + e.getMessage());
            return ResponseEntity.status(500).body(config);
        }
    }
    
    /**
     * 生成测试邮件内容
     */
    private String generateTestEmailContent() {
        return "亲爱的用户，\n\n" +
               "这是一封来自美容院预约系统的测试邮件。\n\n" +
               "如果您收到此邮件，说明邮件服务配置正确，可以正常发送邮件。\n\n" +
               "测试信息：\n" +
               "- 发送时间：" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) + "\n" +
               "- 服务提供商：AWS SES\n" +
               "- 邮件类型：纯文本\n\n" +
               "感谢您使用我们的服务！\n\n" +
               "美容院预约系统团队";
    }
    
    /**
     * 生成测试HTML邮件内容
     */
    private String generateTestHtmlEmailContent() {
        return "<!DOCTYPE html>" +
               "<html>" +
               "<head>" +
               "    <meta charset=\"UTF-8\">" +
               "    <title>测试邮件</title>" +
               "    <style>" +
               "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
               "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }" +
               "        .header { background-color: #8B5CF6; color: white; padding: 20px; text-align: center; }" +
               "        .content { padding: 20px; background-color: #f9f9f9; }" +
               "        .footer { padding: 20px; text-align: center; color: #666; }" +
               "        .info-box { background-color: #e7f3ff; border-left: 4px solid #2196F3; padding: 10px; margin: 10px 0; }" +
               "    </style>" +
               "</head>" +
               "<body>" +
               "    <div class=\"container\">" +
               "        <div class=\"header\">" +
               "            <h1>美容院预约系统</h1>" +
               "            <p>HTML测试邮件</p>" +
               "        </div>" +
               "        <div class=\"content\">" +
               "            <h2>测试邮件</h2>" +
               "            <p>亲爱的用户，</p>" +
               "            <p>这是一封来自美容院预约系统的<strong>HTML测试邮件</strong>。</p>" +
               "            <p>如果您能正常查看此邮件的格式和样式，说明HTML邮件功能工作正常。</p>" +
               "            <div class=\"info-box\">" +
               "                <h3>测试信息</h3>" +
               "                <ul>" +
               "                    <li><strong>发送时间：</strong>" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) + "</li>" +
               "                    <li><strong>服务提供商：</strong>AWS SES</li>" +
               "                    <li><strong>邮件类型：</strong>HTML</li>" +
               "                    <li><strong>支持功能：</strong>样式、图片、链接等</li>" +
               "                </ul>" +
               "            </div>" +
               "            <p>感谢您使用我们的服务！</p>" +
               "        </div>" +
               "        <div class=\"footer\">" +
               "            <p>&copy; 2024 美容院预约系统. 保留所有权利.</p>" +
               "        </div>" +
               "    </div>" +
               "</body>" +
               "</html>";
    }
}