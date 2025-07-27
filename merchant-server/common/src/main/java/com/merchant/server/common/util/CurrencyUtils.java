package com.merchant.server.common.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.util.Locale;

/**
 * 货币工具类
 * 提供统一的货币格式化和计算功能
 */
public class CurrencyUtils {
    
    /**
     * 货币符号 - 美元/加元符号
     */
    public static final String CURRENCY_SYMBOL = "$";
    
    /**
     * 货币代码
     */
    public static final String CURRENCY_CODE = "CAD";
    
    /**
     * 小数位数
     */
    public static final int DECIMAL_PLACES = 2;
    
    /**
     * 舍入模式
     */
    public static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;
    
    /**
     * 货币格式化器
     */
    private static final DecimalFormat CURRENCY_FORMAT = new DecimalFormat("#,##0.00");
    private static final NumberFormat CURRENCY_NUMBER_FORMAT = NumberFormat.getCurrencyInstance(Locale.CANADA);
    
    static {
        CURRENCY_FORMAT.setRoundingMode(ROUNDING_MODE);
        CURRENCY_NUMBER_FORMAT.setRoundingMode(ROUNDING_MODE);
    }
    
    /**
     * 格式化金额显示（带货币符号）
     */
    public static String formatAmount(Double amount) {
        if (amount == null) {
            return CURRENCY_SYMBOL + "0.00";
        }
        return CURRENCY_SYMBOL + CURRENCY_FORMAT.format(amount);
    }
    
    /**
     * 格式化金额显示（带货币符号）
     */
    public static String formatAmount(BigDecimal amount) {
        if (amount == null) {
            return CURRENCY_SYMBOL + "0.00";
        }
        return CURRENCY_SYMBOL + CURRENCY_FORMAT.format(amount);
    }
    
    /**
     * 格式化金额显示（不带货币符号）
     */
    public static String formatAmountWithoutSymbol(Double amount) {
        if (amount == null) {
            return "0.00";
        }
        return CURRENCY_FORMAT.format(amount);
    }
    
    /**
     * 格式化金额显示（不带货币符号）
     */
    public static String formatAmountWithoutSymbol(BigDecimal amount) {
        if (amount == null) {
            return "0.00";
        }
        return CURRENCY_FORMAT.format(amount);
    }
    
    /**
     * 使用系统货币格式化器格式化金额
     */
    public static String formatAmountWithLocale(Double amount) {
        if (amount == null) {
            return CURRENCY_NUMBER_FORMAT.format(0.0);
        }
        return CURRENCY_NUMBER_FORMAT.format(amount);
    }
    
    /**
     * 使用系统货币格式化器格式化金额
     */
    public static String formatAmountWithLocale(BigDecimal amount) {
        if (amount == null) {
            return CURRENCY_NUMBER_FORMAT.format(0.0);
        }
        return CURRENCY_NUMBER_FORMAT.format(amount);
    }
    
    /**
     * 将Double转换为BigDecimal（保留指定小数位数）
     */
    public static BigDecimal toBigDecimal(Double amount) {
        if (amount == null) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(amount).setScale(DECIMAL_PLACES, ROUNDING_MODE);
    }
    
    /**
     * 将BigDecimal转换为Double
     */
    public static Double toDouble(BigDecimal amount) {
        if (amount == null) {
            return 0.0;
        }
        return amount.doubleValue();
    }
    
    /**
     * 计算百分比金额
     */
    public static BigDecimal calculatePercentage(BigDecimal amount, BigDecimal percentage) {
        if (amount == null || percentage == null) {
            return BigDecimal.ZERO;
        }
        return amount.multiply(percentage.divide(BigDecimal.valueOf(100), DECIMAL_PLACES, ROUNDING_MODE))
                .setScale(DECIMAL_PLACES, ROUNDING_MODE);
    }
    
    /**
     * 计算百分比金额
     */
    public static Double calculatePercentage(Double amount, Double percentage) {
        if (amount == null || percentage == null) {
            return 0.0;
        }
        BigDecimal result = toBigDecimal(amount).multiply(toBigDecimal(percentage).divide(BigDecimal.valueOf(100), DECIMAL_PLACES, ROUNDING_MODE));
        return result.doubleValue();
    }
    
    /**
     * 计算税额
     */
    public static BigDecimal calculateTax(BigDecimal amount, BigDecimal taxRate) {
        return calculatePercentage(amount, taxRate);
    }
    
    /**
     * 计算税额
     */
    public static Double calculateTax(Double amount, Double taxRate) {
        return calculatePercentage(amount, taxRate);
    }
    
    /**
     * 计算小费
     */
    public static BigDecimal calculateTip(BigDecimal amount, BigDecimal tipPercentage) {
        return calculatePercentage(amount, tipPercentage);
    }
    
    /**
     * 计算小费
     */
    public static Double calculateTip(Double amount, Double tipPercentage) {
        return calculatePercentage(amount, tipPercentage);
    }
    
    /**
     * 计算总金额（含税和小费）
     */
    public static BigDecimal calculateTotal(BigDecimal subtotal, BigDecimal taxAmount, BigDecimal tipAmount) {
        BigDecimal total = subtotal != null ? subtotal : BigDecimal.ZERO;
        if (taxAmount != null) {
            total = total.add(taxAmount);
        }
        if (tipAmount != null) {
            total = total.add(tipAmount);
        }
        return total.setScale(DECIMAL_PLACES, ROUNDING_MODE);
    }
    
    /**
     * 计算总金额（含税和小费）
     */
    public static Double calculateTotal(Double subtotal, Double taxAmount, Double tipAmount) {
        double total = subtotal != null ? subtotal : 0.0;
        if (taxAmount != null) {
            total += taxAmount;
        }
        if (tipAmount != null) {
            total += tipAmount;
        }
        return toBigDecimal(total).doubleValue();
    }
    
    /**
     * 金额比较（相等）
     */
    public static boolean isEqual(BigDecimal amount1, BigDecimal amount2) {
        if (amount1 == null && amount2 == null) {
            return true;
        }
        if (amount1 == null || amount2 == null) {
            return false;
        }
        return amount1.compareTo(amount2) == 0;
    }
    
    /**
     * 金额比较（大于）
     */
    public static boolean isGreaterThan(BigDecimal amount1, BigDecimal amount2) {
        if (amount1 == null || amount2 == null) {
            return false;
        }
        return amount1.compareTo(amount2) > 0;
    }
    
    /**
     * 金额比较（小于）
     */
    public static boolean isLessThan(BigDecimal amount1, BigDecimal amount2) {
        if (amount1 == null || amount2 == null) {
            return false;
        }
        return amount1.compareTo(amount2) < 0;
    }
    
    /**
     * 获取货币符号
     */
    public static String getCurrencySymbol() {
        return CURRENCY_SYMBOL;
    }
    
    /**
     * 获取货币代码
     */
    public static String getCurrencyCode() {
        return CURRENCY_CODE;
    }
}