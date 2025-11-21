package com.merchant.server.businessservice.utils;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * 支付金额分配工具类
 * 用于处理混合支付场景下的金额分配逻辑
 *
 * @author System
 * @since 2024-11-19
 */
@Slf4j
public class PaymentDistributionUtil {

    /**
     * 支付明细项
     */
    @Data
    public static class PaymentItem {
        /** 支付类别: service/tax/tip */
        private String category;
        /** 支付方式: cash/credit_card/debit_card/gift_card 等 */
        private String method;
        /** 金额 */
        private BigDecimal amount;
        /** 关联的订单服务ID（仅service类别有） */
        private Long orderServiceId;
        /** 参考ID（如礼品卡号） */
        private String referenceId;
        /** 参考类型（如gift_card） */
        private String referenceType;

        public PaymentItem(String category, String method, BigDecimal amount) {
            this.category = category;
            this.method = method;
            this.amount = amount;
        }
    }

    /**
     * 分配支付金额（礼品卡不足场景）
     *
     * @param serviceAmount 服务总额
     * @param taxAmount 税费总额
     * @param tipAmount 小费总额
     * @param giftCardAmount 礼品卡金额
     * @param giftCardNumber 礼品卡号
     * @param additionalPaymentMethod 补充支付方式
     * @param tipPaymentMethod 小费支付方式
     * @param orderServiceId 订单服务ID（单服务场景）
     * @return 支付明细列表
     */
    public static List<PaymentItem> distributeGiftCardPayment(
            BigDecimal serviceAmount,
            BigDecimal taxAmount,
            BigDecimal tipAmount,
            BigDecimal giftCardAmount,
            String giftCardNumber,
            String additionalPaymentMethod,
            String tipPaymentMethod,
            Long orderServiceId) {

        List<PaymentItem> items = new ArrayList<>();

        log.info("Distributing gift card payment - Service: {}, Tax: {}, Tip: {}, GiftCard: {}, Additional: {}, TipMethod: {}",
                serviceAmount, taxAmount, tipAmount, giftCardAmount, additionalPaymentMethod, tipPaymentMethod);

        // 1. 小费单独处理（不参与礼品卡分配）
        if (tipAmount != null && tipAmount.compareTo(BigDecimal.ZERO) > 0) {
            PaymentItem tipItem = new PaymentItem("tip", tipPaymentMethod, tipAmount);
            tipItem.setOrderServiceId(orderServiceId);
            items.add(tipItem);
        }

        // 2. 计算服务+税费的总额（需要用礼品卡和补充方式支付）
        BigDecimal serviceTaxTotal = serviceAmount.add(taxAmount);

        // 3. 如果礼品卡金额大于等于服务+税费总额，全部用礼品卡支付
        if (giftCardAmount.compareTo(serviceTaxTotal) >= 0) {
            // 服务部分
            PaymentItem serviceItem = new PaymentItem("service", "gift_card", serviceAmount);
            serviceItem.setOrderServiceId(orderServiceId);
            serviceItem.setReferenceId(giftCardNumber);
            serviceItem.setReferenceType("gift_card");
            items.add(serviceItem);

            // 税费部分
            PaymentItem taxItem = new PaymentItem("tax", "gift_card", taxAmount);
            taxItem.setReferenceId(giftCardNumber);
            taxItem.setReferenceType("gift_card");
            items.add(taxItem);

            log.info("Gift card covers full amount - Service: {}, Tax: {}", serviceAmount, taxAmount);
            return items;
        }

        // 4. 礼品卡金额不足，需要混合支付
        // 计算礼品卡占比
        BigDecimal giftCardRatio = giftCardAmount.divide(serviceTaxTotal, 6, RoundingMode.HALF_UP);
        BigDecimal additionalRatio = BigDecimal.ONE.subtract(giftCardRatio);

        // 分配服务金额
        BigDecimal serviceGiftCard = serviceAmount.multiply(giftCardRatio).setScale(2, RoundingMode.HALF_UP);
        BigDecimal serviceAdditional = serviceAmount.subtract(serviceGiftCard);

        // 分配税费金额
        BigDecimal taxGiftCard = taxAmount.multiply(giftCardRatio).setScale(2, RoundingMode.HALF_UP);
        BigDecimal taxAdditional = taxAmount.subtract(taxGiftCard);

        // 微调确保总额准确（处理舍入误差）
        BigDecimal giftCardTotal = serviceGiftCard.add(taxGiftCard);
        BigDecimal diff = giftCardAmount.subtract(giftCardTotal);
        if (diff.abs().compareTo(new BigDecimal("0.02")) < 0) {
            // 差额在2分以内，调整税费的礼品卡部分
            taxGiftCard = taxGiftCard.add(diff);
            taxAdditional = taxAdditional.subtract(diff);
        }

        log.info("Gift card distribution - GiftCardRatio: {}, ServiceGC: {}, ServiceAdd: {}, TaxGC: {}, TaxAdd: {}",
                giftCardRatio, serviceGiftCard, serviceAdditional, taxGiftCard, taxAdditional);

        // 添加服务支付明细
        if (serviceGiftCard.compareTo(BigDecimal.ZERO) > 0) {
            PaymentItem item = new PaymentItem("service", "gift_card", serviceGiftCard);
            item.setOrderServiceId(orderServiceId);
            item.setReferenceId(giftCardNumber);
            item.setReferenceType("gift_card");
            items.add(item);
        }

        if (serviceAdditional.compareTo(BigDecimal.ZERO) > 0) {
            PaymentItem item = new PaymentItem("service", additionalPaymentMethod, serviceAdditional);
            item.setOrderServiceId(orderServiceId);
            items.add(item);
        }

        // 添加税费支付明细
        if (taxGiftCard.compareTo(BigDecimal.ZERO) > 0) {
            PaymentItem item = new PaymentItem("tax", "gift_card", taxGiftCard);
            item.setReferenceId(giftCardNumber);
            item.setReferenceType("gift_card");
            items.add(item);
        }

        if (taxAdditional.compareTo(BigDecimal.ZERO) > 0) {
            PaymentItem item = new PaymentItem("tax", additionalPaymentMethod, taxAdditional);
            items.add(item);
        }

        return items;
    }

    /**
     * 分配多服务场景的支付金额
     *
     * @param servicePayments 每个服务的支付信息列表
     * @param totalTaxAmount 总税费
     * @param totalTipAmount 总小费
     * @param tipPaymentMethod 小费支付方式
     * @return 支付明细列表
     */
    @Data
    public static class ServicePaymentInfo {
        private Long orderServiceId;
        private BigDecimal servicePrice;
        private String paymentMethod;
        private BigDecimal giftCardAmount;
        private String giftCardNumber;
        private String additionalPaymentMethod;
    }

    public static List<PaymentItem> distributeMultiServicePayment(
            List<ServicePaymentInfo> servicePayments,
            BigDecimal totalTaxAmount,
            BigDecimal totalTipAmount,
            String tipPaymentMethod) {

        List<PaymentItem> items = new ArrayList<>();

        // 1. 处理每个服务的支付
        BigDecimal totalServiceAmount = BigDecimal.ZERO;
        for (ServicePaymentInfo servicePayment : servicePayments) {
            totalServiceAmount = totalServiceAmount.add(servicePayment.getServicePrice());

            // 如果是礼品卡支付且金额不足
            if ("gift_card".equalsIgnoreCase(servicePayment.getPaymentMethod())) {
                if (servicePayment.getGiftCardAmount().compareTo(servicePayment.getServicePrice()) >= 0) {
                    // 礼品卡足够支付该服务
                    PaymentItem item = new PaymentItem("service", "gift_card", servicePayment.getServicePrice());
                    item.setOrderServiceId(servicePayment.getOrderServiceId());
                    item.setReferenceId(servicePayment.getGiftCardNumber());
                    item.setReferenceType("gift_card");
                    items.add(item);
                } else {
                    // 礼品卡不足，需要混合支付
                    PaymentItem gcItem = new PaymentItem("service", "gift_card", servicePayment.getGiftCardAmount());
                    gcItem.setOrderServiceId(servicePayment.getOrderServiceId());
                    gcItem.setReferenceId(servicePayment.getGiftCardNumber());
                    gcItem.setReferenceType("gift_card");
                    items.add(gcItem);

                    BigDecimal remaining = servicePayment.getServicePrice().subtract(servicePayment.getGiftCardAmount());
                    PaymentItem addItem = new PaymentItem("service", servicePayment.getAdditionalPaymentMethod(), remaining);
                    addItem.setOrderServiceId(servicePayment.getOrderServiceId());
                    items.add(addItem);
                }
            } else {
                // 其他支付方式
                PaymentItem item = new PaymentItem("service", servicePayment.getPaymentMethod(), servicePayment.getServicePrice());
                item.setOrderServiceId(servicePayment.getOrderServiceId());
                items.add(item);
            }
        }

        // 2. 税费按服务金额比例分配到各支付方式
        if (totalTaxAmount != null && totalTaxAmount.compareTo(BigDecimal.ZERO) > 0) {
            distributeTaxByPaymentMethod(items, totalTaxAmount, totalServiceAmount);
        }

        // 3. 小费单独记录
        if (totalTipAmount != null && totalTipAmount.compareTo(BigDecimal.ZERO) > 0) {
            PaymentItem tipItem = new PaymentItem("tip", tipPaymentMethod, totalTipAmount);
            items.add(tipItem);
        }

        return items;
    }

    /**
     * 将税费按支付方式比例分配
     */
    private static void distributeTaxByPaymentMethod(List<PaymentItem> serviceItems, BigDecimal totalTax, BigDecimal totalService) {
        // 按支付方式汇总服务金额
        java.util.Map<String, BigDecimal> methodAmounts = new java.util.HashMap<>();
        for (PaymentItem item : serviceItems) {
            if ("service".equals(item.getCategory())) {
                methodAmounts.merge(item.getMethod(), item.getAmount(), BigDecimal::add);
            }
        }

        // 按比例分配税费
        BigDecimal allocatedTax = BigDecimal.ZERO;
        List<PaymentItem> taxItems = new ArrayList<>();

        for (java.util.Map.Entry<String, BigDecimal> entry : methodAmounts.entrySet()) {
            BigDecimal ratio = entry.getValue().divide(totalService, 6, RoundingMode.HALF_UP);
            BigDecimal taxAmount = totalTax.multiply(ratio).setScale(2, RoundingMode.HALF_UP);
            allocatedTax = allocatedTax.add(taxAmount);

            PaymentItem taxItem = new PaymentItem("tax", entry.getKey(), taxAmount);
            // 如果是礼品卡，设置参考信息
            if ("gift_card".equals(entry.getKey())) {
                // 从服务项中找到礼品卡的参考信息
                for (PaymentItem sItem : serviceItems) {
                    if ("service".equals(sItem.getCategory()) && "gift_card".equals(sItem.getMethod())) {
                        taxItem.setReferenceId(sItem.getReferenceId());
                        taxItem.setReferenceType(sItem.getReferenceType());
                        break;
                    }
                }
            }
            taxItems.add(taxItem);
        }

        // 处理舍入误差：将差额加到最大的税费项上
        BigDecimal diff = totalTax.subtract(allocatedTax);
        if (diff.abs().compareTo(new BigDecimal("0.02")) < 0 && !taxItems.isEmpty()) {
            PaymentItem largest = taxItems.stream()
                    .max((a, b) -> a.getAmount().compareTo(b.getAmount()))
                    .orElse(null);
            if (largest != null) {
                largest.setAmount(largest.getAmount().add(diff));
            }
        }

        serviceItems.addAll(taxItems);
    }

    /**
     * 分配普通支付（非礼品卡，非混合）
     */
    public static List<PaymentItem> distributeRegularPayment(
            BigDecimal serviceAmount,
            BigDecimal taxAmount,
            BigDecimal tipAmount,
            String paymentMethod,
            String tipPaymentMethod,
            Long orderServiceId) {

        List<PaymentItem> items = new ArrayList<>();

        // 服务金额
        if (serviceAmount != null && serviceAmount.compareTo(BigDecimal.ZERO) > 0) {
            PaymentItem item = new PaymentItem("service", paymentMethod, serviceAmount);
            item.setOrderServiceId(orderServiceId);
            items.add(item);
        }

        // 税费
        if (taxAmount != null && taxAmount.compareTo(BigDecimal.ZERO) > 0) {
            PaymentItem item = new PaymentItem("tax", paymentMethod, taxAmount);
            items.add(item);
        }

        // 小费
        if (tipAmount != null && tipAmount.compareTo(BigDecimal.ZERO) > 0) {
            String tipMethod = (tipPaymentMethod != null && !tipPaymentMethod.isEmpty())
                    ? tipPaymentMethod : paymentMethod;
            PaymentItem item = new PaymentItem("tip", tipMethod, tipAmount);
            items.add(item);
        }

        return items;
    }
}
