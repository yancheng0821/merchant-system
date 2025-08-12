package com.merchant.server.businessservice.enums;

/**
 * 退款原因枚举
 * 支持多种退款原因，映射到Stripe的三种标准原因
 */
public enum RefundReason {
    DUPLICATE_CHARGE("duplicate", "重复收费", "Duplicate Charge"),
    FRAUDULENT("fraudulent", "欺诈交易", "Fraudulent"),
    CUSTOMER_REQUEST("requested_by_customer", "客户要求", "Customer Request"),
    PRODUCT_UNACCEPTABLE("requested_by_customer", "产品不满意", "Product Unacceptable"),
    SERVICE_UNSATISFACTORY("requested_by_customer", "服务不满意", "Service Unsatisfactory"),
    ORDER_CANCELLED("requested_by_customer", "订单取消", "Order Cancelled"),
    OTHER("requested_by_customer", "其他", "Other");
    
    private final String stripeValue;
    private final String chineseDisplay;
    private final String englishDisplay;
    
    RefundReason(String stripeValue, String chineseDisplay, String englishDisplay) {
        this.stripeValue = stripeValue;
        this.chineseDisplay = chineseDisplay;
        this.englishDisplay = englishDisplay;
    }
    
    public String getStripeValue() {
        return stripeValue;
    }
    
    public String getChineseDisplay() {
        return chineseDisplay;
    }
    
    public String getEnglishDisplay() {
        return englishDisplay;
    }
    
    /**
     * 根据值获取枚举
     */
    public static RefundReason fromValue(String value) {
        if (value == null) {
            return CUSTOMER_REQUEST;
        }
        
        for (RefundReason reason : values()) {
            if (reason.stripeValue.equalsIgnoreCase(value) || 
                reason.name().equalsIgnoreCase(value) ||
                reason.chineseDisplay.equalsIgnoreCase(value) ||
                reason.englishDisplay.equalsIgnoreCase(value)) {
                return reason;
            }
        }
        return CUSTOMER_REQUEST;
    }
    
    /**
     * 根据前端传来的文本获取对应的友好显示文本
     * @param frontendValue 前端传来的值（如 DUPLICATE_CHARGE）
     * @param language 语言（zh 或 en）
     * @return 友好的显示文本
     */
    public static String getDisplayText(String frontendValue, String language) {
        try {
            RefundReason reason = RefundReason.valueOf(frontendValue);
            return "zh".equalsIgnoreCase(language) ? reason.getChineseDisplay() : reason.getEnglishDisplay();
        } catch (Exception e) {
            // 如果找不到对应的枚举，返回原值
            return frontendValue;
        }
    }
}