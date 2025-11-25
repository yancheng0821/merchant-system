package com.merchant.server.merchantservice.service.impl;

import com.merchant.server.merchantservice.service.TaxCalculationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

/**
 * 税费计算服务实现
 * 支持加拿大各省的税率计算
 */
@Slf4j
@Service
public class TaxCalculationServiceImpl implements TaxCalculationService {

    /**
     * 加拿大各省税率映射
     * 数据来源：加拿大税务局 (CRA) 2024年税率
     */
    private static final Map<String, BigDecimal> CANADIAN_TAX_RATES = new HashMap<>();

    static {
        // BC - British Columbia: GST 5% only (PST does not apply to SaaS)
        CANADIAN_TAX_RATES.put("BC", new BigDecimal("0.05"));
        CANADIAN_TAX_RATES.put("BRITISH COLUMBIA", new BigDecimal("0.05"));

        // AB - Alberta: GST 5% only
        CANADIAN_TAX_RATES.put("AB", new BigDecimal("0.05"));
        CANADIAN_TAX_RATES.put("ALBERTA", new BigDecimal("0.05"));

        // SK - Saskatchewan: GST 5% + PST 6% = 11% (PST applies to SaaS)
        CANADIAN_TAX_RATES.put("SK", new BigDecimal("0.11"));
        CANADIAN_TAX_RATES.put("SASKATCHEWAN", new BigDecimal("0.11"));

        // MB - Manitoba: GST 5% + RST 7% = 12% (RST applies to SaaS)
        CANADIAN_TAX_RATES.put("MB", new BigDecimal("0.12"));
        CANADIAN_TAX_RATES.put("MANITOBA", new BigDecimal("0.12"));

        // ON - Ontario: HST 13%
        CANADIAN_TAX_RATES.put("ON", new BigDecimal("0.13"));
        CANADIAN_TAX_RATES.put("ONTARIO", new BigDecimal("0.13"));

        // QC - Quebec: GST 5% + QST 9.975% = 14.975%
        CANADIAN_TAX_RATES.put("QC", new BigDecimal("0.14975"));
        CANADIAN_TAX_RATES.put("QUEBEC", new BigDecimal("0.14975"));

        // NB - New Brunswick: HST 15%
        CANADIAN_TAX_RATES.put("NB", new BigDecimal("0.15"));
        CANADIAN_TAX_RATES.put("NEW BRUNSWICK", new BigDecimal("0.15"));

        // NS - Nova Scotia: HST 15%
        CANADIAN_TAX_RATES.put("NS", new BigDecimal("0.15"));
        CANADIAN_TAX_RATES.put("NOVA SCOTIA", new BigDecimal("0.15"));

        // PE - Prince Edward Island: HST 15%
        CANADIAN_TAX_RATES.put("PE", new BigDecimal("0.15"));
        CANADIAN_TAX_RATES.put("PEI", new BigDecimal("0.15"));
        CANADIAN_TAX_RATES.put("PRINCE EDWARD ISLAND", new BigDecimal("0.15"));

        // NL - Newfoundland and Labrador: HST 15%
        CANADIAN_TAX_RATES.put("NL", new BigDecimal("0.15"));
        CANADIAN_TAX_RATES.put("NEWFOUNDLAND", new BigDecimal("0.15"));
        CANADIAN_TAX_RATES.put("NEWFOUNDLAND AND LABRADOR", new BigDecimal("0.15"));

        // YT - Yukon: GST 5% only
        CANADIAN_TAX_RATES.put("YT", new BigDecimal("0.05"));
        CANADIAN_TAX_RATES.put("YUKON", new BigDecimal("0.05"));

        // NT - Northwest Territories: GST 5% only
        CANADIAN_TAX_RATES.put("NT", new BigDecimal("0.05"));
        CANADIAN_TAX_RATES.put("NORTHWEST TERRITORIES", new BigDecimal("0.05"));

        // NU - Nunavut: GST 5% only
        CANADIAN_TAX_RATES.put("NU", new BigDecimal("0.05"));
        CANADIAN_TAX_RATES.put("NUNAVUT", new BigDecimal("0.05"));
    }

    @Override
    public BigDecimal getTaxRateByProvince(String province) {
        if (province == null || province.trim().isEmpty()) {
            log.debug("省份为空，返回0税率");
            return BigDecimal.ZERO;
        }

        String normalizedProvince = province.trim().toUpperCase();
        BigDecimal taxRate = CANADIAN_TAX_RATES.get(normalizedProvince);

        if (taxRate == null) {
            log.debug("未找到省份 {} 的税率，返回0（国际客户）", province);
            return BigDecimal.ZERO;
        }

        log.debug("省份 {} 的税率: {}", province, taxRate);
        return taxRate;
    }

    @Override
    public BigDecimal calculateTaxAmount(BigDecimal subtotal, String province) {
        if (subtotal == null) {
            log.warn("税前金额为null，返回0");
            return BigDecimal.ZERO;
        }

        BigDecimal taxRate = getTaxRateByProvince(province);
        BigDecimal taxAmount = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);

        log.debug("计算税额 - 税前: {}, 税率: {}, 税额: {}", subtotal, taxRate, taxAmount);
        return taxAmount;
    }

    @Override
    public BigDecimal calculateTotalAmount(BigDecimal subtotal, String province) {
        if (subtotal == null) {
            log.warn("税前金额为null，返回0");
            return BigDecimal.ZERO;
        }

        BigDecimal taxAmount = calculateTaxAmount(subtotal, province);
        BigDecimal total = subtotal.add(taxAmount).setScale(2, RoundingMode.HALF_UP);

        log.debug("计算总额 - 税前: {}, 税额: {}, 总额: {}", subtotal, taxAmount, total);
        return total;
    }

    @Override
    public boolean isCanadianProvince(String province) {
        if (province == null || province.trim().isEmpty()) {
            return false;
        }

        String normalizedProvince = province.trim().toUpperCase();
        return CANADIAN_TAX_RATES.containsKey(normalizedProvince);
    }

    @Override
    public String getTaxRegion(String province) {
        if (province == null || province.trim().isEmpty()) {
            return "INTERNATIONAL";
        }

        String normalizedProvince = province.trim().toUpperCase();

        if (CANADIAN_TAX_RATES.containsKey(normalizedProvince)) {
            // 返回标准省份代码（如果输入的是全名，转换为缩写）
            switch (normalizedProvince) {
                case "BRITISH COLUMBIA":
                    return "BC";
                case "ALBERTA":
                    return "AB";
                case "SASKATCHEWAN":
                    return "SK";
                case "MANITOBA":
                    return "MB";
                case "ONTARIO":
                    return "ON";
                case "QUEBEC":
                    return "QC";
                case "NEW BRUNSWICK":
                    return "NB";
                case "NOVA SCOTIA":
                    return "NS";
                case "PRINCE EDWARD ISLAND":
                    return "PE";
                case "NEWFOUNDLAND AND LABRADOR":
                case "NEWFOUNDLAND":
                    return "NL";
                case "YUKON":
                    return "YT";
                case "NORTHWEST TERRITORIES":
                    return "NT";
                case "NUNAVUT":
                    return "NU";
                default:
                    return normalizedProvince;
            }
        }

        return "INTERNATIONAL";
    }
}
