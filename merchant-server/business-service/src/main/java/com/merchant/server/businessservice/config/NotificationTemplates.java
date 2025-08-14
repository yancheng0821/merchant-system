package com.merchant.server.businessservice.config;

import java.util.HashMap;
import java.util.Map;

/**
 * 通知模板配置
 */
public class NotificationTemplates {
    
    private static final Map<String, Map<String, String>> TEMPLATES = new HashMap<>();
    
    static {
        // 初始化中文模板
        Map<String, String> zhTemplates = new HashMap<>();
        zhTemplates.put("NEW_APPOINTMENT_TITLE", "新预约提醒");
        zhTemplates.put("NEW_APPOINTMENT_CONTENT", "%s %s预约了%s的%s");
        zhTemplates.put("APPOINTMENT_CANCELLED_TITLE", "预约取消提醒");
        zhTemplates.put("APPOINTMENT_CANCELLED_CONTENT", "%s %s取消了%s的%s预约");
        zhTemplates.put("APPOINTMENT_CONFIRMED_TITLE", "预约确认提醒");
        zhTemplates.put("APPOINTMENT_CONFIRMED_CONTENT", "%s %s的%s预约已确认，时间：%s");
        zhTemplates.put("APPOINTMENT_REMINDER_TITLE", "预约即将开始");
        zhTemplates.put("APPOINTMENT_REMINDER_CONTENT", "%s %s的%s预约将在30分钟后开始");
        zhTemplates.put("PENDING_CONFIRMATION_TITLE", "待确认预约提醒");
        zhTemplates.put("PENDING_CONFIRMATION_CONTENT", "有%d个预约待确认，请及时处理");
        
        // 支付相关通知
        zhTemplates.put("PAYMENT_SUCCESS_TITLE", "支付成功");
        zhTemplates.put("PAYMENT_SUCCESS_CONTENT", "订单 #%s 支付成功，金额：$%.2f");
        zhTemplates.put("PAYMENT_FAILED_TITLE", "支付失败");
        zhTemplates.put("PAYMENT_FAILED_CONTENT", "订单 #%s 支付失败，请重试");
        zhTemplates.put("REFUND_SUCCESS_TITLE", "退款成功");
        zhTemplates.put("REFUND_SUCCESS_CONTENT", "订单 #%s 退款成功，金额：$%.2f");
        
        TEMPLATES.put("zh-CN", zhTemplates);
        TEMPLATES.put("zh", zhTemplates);
        
        // 初始化英文模板
        Map<String, String> enTemplates = new HashMap<>();
        enTemplates.put("NEW_APPOINTMENT_TITLE", "New Appointment");
        enTemplates.put("NEW_APPOINTMENT_CONTENT", "%s %s has booked %s on %s at %s");
        enTemplates.put("APPOINTMENT_CANCELLED_TITLE", "Appointment Cancelled");
        enTemplates.put("APPOINTMENT_CANCELLED_CONTENT", "%s %s has cancelled the %s appointment on %s at %s");
        enTemplates.put("APPOINTMENT_CONFIRMED_TITLE", "Appointment Confirmed");
        enTemplates.put("APPOINTMENT_CONFIRMED_CONTENT", "%s %s's %s appointment has been confirmed for %s at %s");
        enTemplates.put("APPOINTMENT_REMINDER_TITLE", "Appointment Starting Soon");
        enTemplates.put("APPOINTMENT_REMINDER_CONTENT", "%s %s's %s appointment will start in 30 minutes");
        enTemplates.put("PENDING_CONFIRMATION_TITLE", "Pending Confirmations");
        enTemplates.put("PENDING_CONFIRMATION_CONTENT", "You have %d appointment(s) pending confirmation");
        
        // Payment related notifications
        enTemplates.put("PAYMENT_SUCCESS_TITLE", "Payment Successful");
        enTemplates.put("PAYMENT_SUCCESS_CONTENT", "Order #%s payment successful, amount: $%.2f");
        enTemplates.put("PAYMENT_FAILED_TITLE", "Payment Failed");
        enTemplates.put("PAYMENT_FAILED_CONTENT", "Order #%s payment failed, please try again");
        enTemplates.put("REFUND_SUCCESS_TITLE", "Refund Successful");
        enTemplates.put("REFUND_SUCCESS_CONTENT", "Order #%s refund successful, amount: $%.2f");
        
        TEMPLATES.put("en-US", enTemplates);
        TEMPLATES.put("en", enTemplates);
    }
    
    /**
     * 获取模板
     */
    public static String getTemplate(String language, String key) {
        Map<String, String> langTemplates = TEMPLATES.get(language);
        if (langTemplates == null) {
            langTemplates = TEMPLATES.get("zh-CN"); // 默认中文
        }
        return langTemplates.getOrDefault(key, key);
    }
    
    /**
     * 检查语言是否支持
     */
    public static boolean isLanguageSupported(String language) {
        return TEMPLATES.containsKey(language);
    }
    
    /**
     * 获取默认语言
     */
    public static String getDefaultLanguage() {
        return "zh-CN";
    }
}