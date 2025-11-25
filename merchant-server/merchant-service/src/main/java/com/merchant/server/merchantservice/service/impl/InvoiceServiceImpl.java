package com.merchant.server.merchantservice.service.impl;

import com.merchant.server.common.exception.BusinessException;
import com.merchant.server.merchantservice.entity.Invoice;
import com.merchant.server.merchantservice.entity.Merchant;
import com.merchant.server.merchantservice.entity.TenantSubscription;
import com.merchant.server.merchantservice.mapper.InvoiceMapper;
import com.merchant.server.merchantservice.mapper.MerchantMapper;
import com.merchant.server.merchantservice.service.InvoiceService;
import com.merchant.server.merchantservice.service.TaxCalculationService;
import com.merchant.server.merchantservice.service.TenantSubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceMapper invoiceMapper;
    private final TenantSubscriptionService tenantSubscriptionService;
    private final MerchantMapper merchantMapper;
    private final TaxCalculationService taxCalculationService;

    public InvoiceServiceImpl(InvoiceMapper invoiceMapper,
                              @Lazy TenantSubscriptionService tenantSubscriptionService,
                              MerchantMapper merchantMapper,
                              TaxCalculationService taxCalculationService) {
        this.invoiceMapper = invoiceMapper;
        this.tenantSubscriptionService = tenantSubscriptionService;
        this.merchantMapper = merchantMapper;
        this.taxCalculationService = taxCalculationService;
    }

    @Override
    public Invoice getInvoiceById(Long id) {
        log.info("查询账单，id: {}", id);
        return invoiceMapper.findById(id);
    }

    @Override
    public List<Invoice> getInvoicesByTenantId(Long tenantId) {
        log.info("查询租户账单列表，tenantId: {}", tenantId);
        return invoiceMapper.findByTenantId(tenantId);
    }

    @Override
    public Invoice getInvoiceByNumber(String invoiceNumber) {
        log.info("查询账单，invoiceNumber: {}", invoiceNumber);
        return invoiceMapper.findByInvoiceNumber(invoiceNumber);
    }

    @Override
    public Invoice createInvoice(Invoice invoice) {
        log.info("创建账单，tenantId: {}, amount: {}", invoice.getTenantId(), invoice.getAmount());

        // 如果没有账单号，自动生成
        if (invoice.getInvoiceNumber() == null || invoice.getInvoiceNumber().isEmpty()) {
            invoice.setInvoiceNumber(generateInvoiceNumber());
        }

        int result = invoiceMapper.insert(invoice);
        if (result == 0) {
            throw new RuntimeException("创建账单失败");
        }

        return invoice;
    }

    @Override
    public Invoice updateInvoice(Invoice invoice) {
        log.info("更新账单，id: {}, status: {}", invoice.getId(), invoice.getStatus());

        int result = invoiceMapper.update(invoice);
        if (result == 0) {
            throw new RuntimeException("更新账单失败，未找到对应记录");
        }

        return invoiceMapper.findById(invoice.getId());
    }

    @Override
    public boolean deleteInvoice(Long id) {
        log.info("删除账单，id: {}", id);
        int result = invoiceMapper.delete(id);
        return result > 0;
    }

    @Override
    public String generateInvoiceNumber() {
        // 生成账单号：INV-YYYYMM-随机数
        String yearMonth = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        String randomPart = String.format("%04d", (int)(Math.random() * 10000));
        String invoiceNumber = "INV-" + yearMonth + "-" + randomPart;

        // 如果账单号已存在，重新生成
        if (invoiceMapper.findByInvoiceNumber(invoiceNumber) != null) {
            return generateInvoiceNumber();
        }

        log.info("生成账单号: {}", invoiceNumber);
        return invoiceNumber;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Invoice generateInvoiceForSubscription(Long subscriptionId) {
        log.info("为订阅生成账单 - 订阅ID: {}", subscriptionId);

        // 查询订阅信息
        TenantSubscription subscription = tenantSubscriptionService.getSubscriptionById(subscriptionId);
        if (subscription == null) {
            throw new BusinessException("订阅不存在");
        }

        if (subscription.getPlan() == null) {
            throw new BusinessException("订阅计划不存在");
        }

        // 如果是试用期，不生成账单
        if (subscription.getStatus() == TenantSubscription.SubscriptionStatus.TRIAL) {
            log.info("订阅处于试用期，不生成账单");
            return null;
        }

        // 获取商户信息
        Merchant merchant = merchantMapper.selectByTenantId(subscription.getTenantId());
        if (merchant == null) {
            throw new BusinessException("商户信息不存在");
        }

        String merchantName = merchant.getMerchantName() != null
                ? merchant.getMerchantName()
                : "Merchant-" + subscription.getTenantId();

        // 获取商户省份（用于税率计算）
        String province = merchant.getProvince();

        // 创建账单对象
        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(generateInvoiceNumber());
        invoice.setTenantId(subscription.getTenantId());
        invoice.setTenantName(merchantName);
        invoice.setSubscriptionId(subscriptionId);

        // 计算税前金额
        BigDecimal subtotal;
        if (subscription.getBillingCycle() == TenantSubscription.BillingCycle.MONTHLY) {
            subtotal = subscription.getPlan().getMonthlyPrice();
        } else {
            subtotal = subscription.getPlan().getYearlyPrice();
        }

        // 计算税额
        BigDecimal taxRate = taxCalculationService.getTaxRateByProvince(province);
        BigDecimal taxAmount = taxCalculationService.calculateTaxAmount(subtotal, province);
        BigDecimal totalAmount = taxCalculationService.calculateTotalAmount(subtotal, province);
        String taxRegion = taxCalculationService.getTaxRegion(province);

        // 设置金额相关字段
        invoice.setSubtotal(subtotal);
        invoice.setTaxRate(taxRate);
        invoice.setTaxAmount(taxAmount);
        invoice.setAmount(totalAmount);
        invoice.setCurrency("CAD");
        invoice.setTaxRegion(taxRegion);

        log.info("账单税费计算 - 省份: {}, 税区: {}, 税前: {}, 税率: {}, 税额: {}, 总额: {}",
                province, taxRegion, subtotal, taxRate, taxAmount, totalAmount);

        // 设置账单周期
        invoice.setBillingPeriodStart(subscription.getCurrentPeriodStart());
        invoice.setBillingPeriodEnd(subscription.getCurrentPeriodEnd());

        // 设置账单状态
        invoice.setStatus(Invoice.InvoiceStatus.PENDING);

        // 设置描述
        String planName = subscription.getPlan().getPlanNameEn();
        String cycle = subscription.getBillingCycle() == TenantSubscription.BillingCycle.MONTHLY ? "Monthly" : "Yearly";
        invoice.setDescription(String.format("%s - %s Subscription", planName, cycle));

        // 创建账单
        Invoice createdInvoice = createInvoice(invoice);
        log.info("账单生成成功 - 账单号: {}, 金额: {} {}", createdInvoice.getInvoiceNumber(), createdInvoice.getAmount(), createdInvoice.getCurrency());

        return createdInvoice;
    }

    @Override
    public List<Invoice> getInvoicesBySubscriptionId(Long subscriptionId) {
        log.info("查询订阅账单列表，subscriptionId: {}", subscriptionId);
        return invoiceMapper.findBySubscriptionId(subscriptionId);
    }
}
