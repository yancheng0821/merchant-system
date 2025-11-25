package com.merchant.server.merchantservice.service;

import java.math.BigDecimal;

/**
 * 税费计算服务接口
 */
public interface TaxCalculationService {

    /**
     * 根据省份获取税率
     *
     * @param province 省份代码（如BC, ON等）
     * @return 税率（如0.12表示12%），如果不是加拿大省份返回0
     */
    BigDecimal getTaxRateByProvince(String province);

    /**
     * 计算税额
     *
     * @param subtotal 税前金额
     * @param province 省份代码
     * @return 税额
     */
    BigDecimal calculateTaxAmount(BigDecimal subtotal, String province);

    /**
     * 计算含税总额
     *
     * @param subtotal 税前金额
     * @param province 省份代码
     * @return 含税总额
     */
    BigDecimal calculateTotalAmount(BigDecimal subtotal, String province);

    /**
     * 判断是否为加拿大省份
     *
     * @param province 省份代码
     * @return 是否为加拿大省份
     */
    boolean isCanadianProvince(String province);

    /**
     * 获取税区名称（用于记录）
     *
     * @param province 省份代码
     * @return 税区名称（如BC, ON或INTERNATIONAL）
     */
    String getTaxRegion(String province);
}
