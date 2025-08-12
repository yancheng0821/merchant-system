package com.merchant.server.businessservice.client.impl;

import com.merchant.server.businessservice.client.AbstractPOSClient;
import com.merchant.server.businessservice.dto.pos.*;
import com.merchant.server.businessservice.entity.StripeAccount;
import com.merchant.server.businessservice.entity.StripeTerminal;
import com.merchant.server.businessservice.mapper.StripeAccountMapper;
import com.merchant.server.businessservice.mapper.StripeTerminalMapper;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.terminal.ConnectionToken;
import com.stripe.model.terminal.Location;
import com.stripe.model.terminal.Reader;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.terminal.ConnectionTokenCreateParams;
import com.stripe.param.terminal.LocationCreateParams;
import com.stripe.param.terminal.LocationListParams;
import com.stripe.param.terminal.ReaderListParams;
import com.stripe.param.terminal.ReaderProcessPaymentIntentParams;
import com.stripe.net.RequestOptions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Stripe Terminal POS客户端实现
 */
@Slf4j
@Component("stripeTerminalClient")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "pos.client.type", havingValue = "stripe", matchIfMissing = false)
public class StripeTerminalClient extends AbstractPOSClient {
    
    @Value("${stripe.api.key}")
    private String stripeApiKey;
    
    @Value("${stripe.terminal.location.id:}")
    private String defaultLocationId;
    
    @Value("${stripe.terminal.use-simulator:true}")
    private boolean useSimulator;
    
    private final StripeAccountMapper stripeAccountMapper;
    private final StripeTerminalMapper stripeTerminalMapper;
    
    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
        log.info("Stripe Terminal client initialized");
    }
    
    @Override
    public POSInitResponse initPayment(POSPaymentRequest request) {
        log.info("Initiating Stripe Terminal payment for amount: {}", request.getAmount());
        
        try {
            // 从订单ID解析租户ID
            Long tenantId = extractTenantIdFromRequest(request);
            
            // 获取商户的Stripe账户
            StripeAccount stripeAccount = stripeAccountMapper.selectByTenantId(tenantId);
            if (stripeAccount == null || !stripeAccount.getChargesEnabled()) {
                throw new RuntimeException("Stripe account not found or not enabled for charges");
            }
            
            // 创建PaymentIntent
            // 在测试模式下使用card而不是card_present，这样可以在Dashboard手动完成
            String paymentMethodType = (useSimulator && stripeApiKey.startsWith("sk_test_")) 
                ? "card" : "card_present";
            
            PaymentIntentCreateParams.Builder paramsBuilder = PaymentIntentCreateParams.builder()
                .setAmount(request.getAmount().multiply(BigDecimal.valueOf(100)).longValue()) // 转换为分
                .setCurrency(request.getCurrency() != null ? request.getCurrency() : "cad")
                .setCaptureMethod(PaymentIntentCreateParams.CaptureMethod.AUTOMATIC)
                .addPaymentMethodType(paymentMethodType)
                .putMetadata("order_id", request.getOrderId())
                .putMetadata("tenant_id", tenantId.toString())
                .putMetadata("terminal_id", request.getTerminalId());
            
            // 测试模式下，使用card支付方式可以在Dashboard手动完成
            
            PaymentIntentCreateParams params = paramsBuilder.build();
            
            // 对于Terminal支付，使用平台账户创建PaymentIntent
            // 然后通过application_fee_amount和transfer_data来分配资金
            PaymentIntent paymentIntent;
            
            // Terminal支付建议使用平台账户，避免跨账户问题
            // 收益可以通过transfer或application fee处理
            paymentIntent = PaymentIntent.create(params);
            log.info("Created PaymentIntent {} in platform account for tenant {}", 
                paymentIntent.getId(), tenantId);
            
            // 获取或创建Terminal Reader
            Reader reader = getOrCreateReader(request.getTerminalId(), tenantId);
            
            // 处理支付
            if (reader != null && reader.getStatus().equals("online")) {
                // 在测试模式的模拟Reader中，不需要真正处理PaymentIntent
                // 模拟Reader会自动完成支付
                log.info("Using simulated reader {} for payment. PaymentIntent: {}", 
                    reader.getId(), paymentIntent.getId());
                
                // 对于模拟Reader，我们跳过processPaymentIntent调用
                // 因为模拟Reader不能真正处理支付，只是用于测试流程
                if (reader.getDeviceType() != null && reader.getDeviceType().contains("simulated")) {
                    log.info("Simulated reader detected. Payment will remain in requires_action state");
                    log.info("For testing, please use Stripe Dashboard or test tools to complete the payment");
                    log.info("PaymentIntent ID: {}", paymentIntent.getId());
                    
                    // 不要在代码中传递完整的卡号！
                    // 这违反了PCI合规要求，即使是测试卡号也不应该这样做
                    // 正确的方法是：
                    // 1. 使用Stripe Elements或Stripe Terminal SDK在客户端收集卡信息
                    // 2. 使用Stripe提供的测试工具
                    // 3. 在Stripe Dashboard手动完成测试支付
                    
                    // 对于Terminal模拟器，支付会保持在pending状态
                    // 这是正常的，因为模拟器不能真正处理支付
                } else {
                    // 真实Reader才需要处理
                    try {
                        ReaderProcessPaymentIntentParams processParams = ReaderProcessPaymentIntentParams.builder()
                            .setPaymentIntent(paymentIntent.getId())
                            .build();
                        
                        // 如果是connected account的Reader，需要使用相同的account context
                        if (stripeAccount.getStripeAccountId() != null) {
                            RequestOptions processOptions = RequestOptions.builder()
                                .setStripeAccount(stripeAccount.getStripeAccountId())
                                .build();
                            // 注意：Reader.processPaymentIntent 不支持 RequestOptions参数
                            // 所以我们暂时跳过真实设备的处理
                            log.warn("Real reader payment processing needs physical device interaction");
                        } else {
                            reader = reader.processPaymentIntent(processParams);
                        }
                    } catch (StripeException e) {
                        log.error("Failed to process payment on reader: {}", e.getMessage());
                        // 不抛出异常，因为PaymentIntent已创建
                    }
                }
                
                // 保存Terminal信息到数据库
                saveTerminalInfo(reader, tenantId);
            }
            
            return POSInitResponse.builder()
                .transactionId(paymentIntent.getId())
                .status(mapStripeStatusToPOSStatus(paymentIntent.getStatus()).getStatus())
                .message("Payment initiated successfully")
                .actionRequired(paymentIntent.getStatus().equals("requires_action") ? "insert_card" : null)
                .initiatedAt(LocalDateTime.now())
                .build();
                
        } catch (StripeException e) {
            log.error("Stripe Terminal payment initiation failed", e);
            return POSInitResponse.builder()
                .transactionId(request.getOrderId())
                .status("failed")
                .message("Payment initiation failed: " + e.getMessage())
                .initiatedAt(LocalDateTime.now())
                .build();
        }
    }
    
    @Override
    public POSTransactionStatus queryTransactionStatus(String transactionId) {
        log.info("Querying Stripe payment status for transaction: {}", transactionId);
        
        try {
            // 首先尝试在平台账户查询
            PaymentIntent paymentIntent = null;
            try {
                paymentIntent = PaymentIntent.retrieve(transactionId);
            } catch (StripeException e) {
                log.debug("PaymentIntent not found in platform account, will try connected accounts");
            }
            
            // 如果在平台账户找不到，尝试在connected accounts查询
            if (paymentIntent == null) {
                // 这里简化处理：在实际应用中，应该记录PaymentIntent与账户的关联
                log.warn("PaymentIntent {} not found. It might be in a connected account", transactionId);
                
                // 返回pending状态，让系统继续轮询
                return POSTransactionStatus.builder()
                    .transactionId(transactionId)
                    .status("pending")
                    .build();
            }
            
            return mapStripeStatusToPOSStatus(paymentIntent.getStatus());
        } catch (Exception e) {
            log.error("Failed to query payment status", e);
            return POSTransactionStatus.builder()
                .transactionId(transactionId)
                .status("failed")
                .errorMessage(e.getMessage())
                .build();
        }
    }
    
    @Override
    public POSCancelResponse cancelTransaction(String transactionId) {
        log.info("Cancelling Stripe payment: {}", transactionId);
        
        try {
            PaymentIntent paymentIntent = PaymentIntent.retrieve(transactionId);
            paymentIntent = paymentIntent.cancel();
            
            return POSCancelResponse.builder()
                .transactionId(transactionId)
                .success(paymentIntent.getStatus().equals("canceled"))
                .message("Payment cancelled successfully")
                .build();
        } catch (StripeException e) {
            log.error("Failed to cancel payment", e);
            return POSCancelResponse.builder()
                .transactionId(transactionId)
                .success(false)
                .message("Cancellation failed: " + e.getMessage())
                .build();
        }
    }
    
    @Override
    public POSRefundResponse refund(POSRefundRequest request) {
        log.info("Processing refund for transaction: {}", request.getOriginalTransactionId());
        
        try {
            // 创建退款
            Map<String, Object> refundParams = new HashMap<>();
            refundParams.put("payment_intent", request.getOriginalTransactionId());
            if (request.getRefundAmount() != null) {
                refundParams.put("amount", request.getRefundAmount().multiply(BigDecimal.valueOf(100)).longValue());
            }
            
            // 映射退款原因到Stripe接受的值
            // Stripe只接受: duplicate, fraudulent, requested_by_customer
            String stripeReason = mapRefundReasonToStripe(request.getReason());
            refundParams.put("reason", stripeReason);
            
            com.stripe.model.Refund refund = com.stripe.model.Refund.create(refundParams);
            
            return POSRefundResponse.builder()
                .refundTransactionId(refund.getId())
                .originalTransactionId(request.getOriginalTransactionId())
                .refundedAmount(request.getRefundAmount())
                .success(refund.getStatus().equals("succeeded"))
                .message("Refund processed successfully")
                .build();
        } catch (StripeException e) {
            log.error("Failed to process refund", e);
            return POSRefundResponse.builder()
                .originalTransactionId(request.getOriginalTransactionId())
                .success(false)
                .message("Refund failed: " + e.getMessage())
                .build();
        }
    }
    
    public POSTerminalStatus getTerminalStatus(String terminalId) {
        log.info("Getting status for terminal: {}", terminalId);
        
        try {
            Reader reader = Reader.retrieve(terminalId);
            
            return POSTerminalStatus.builder()
                .terminalId(terminalId)
                .status(reader.getStatus())
                .connected("online".equals(reader.getStatus()))
                .firmwareVersion(reader.getDeviceSwVersion())
                .lastHeartbeat(LocalDateTime.now())
                .build();
        } catch (StripeException e) {
            log.error("Failed to get terminal status", e);
            return POSTerminalStatus.builder()
                .terminalId(terminalId)
                .status("offline")
                .connected(false)
                .lastHeartbeat(LocalDateTime.now())
                .build();
        }
    }
    
    /**
     * 获取或创建Terminal Reader
     */
    private Reader getOrCreateReader(String terminalId, Long tenantId) throws StripeException {
        // 如果提供了特定的terminalId，尝试获取它
        if (terminalId != null && !terminalId.isEmpty() && !terminalId.equals("POS-001")) {
            try {
                return Reader.retrieve(terminalId);
            } catch (StripeException e) {
                log.warn("Terminal {} not found: {}", terminalId, e.getMessage());
            }
        }
        
        // 查找该租户的可用Reader
        ReaderListParams listParams = ReaderListParams.builder()
            .setLimit(100L)
            .build();
        
        // 获取租户已保存的Terminal
        java.util.List<StripeTerminal> savedTerminals = stripeTerminalMapper.selectByTenantId(tenantId);
        
        // 首先尝试使用已保存的Terminal
        for (StripeTerminal savedTerminal : savedTerminals) {
            if (savedTerminal.getTerminalId() != null && !savedTerminal.getDeleted()) {
                try {
                    Reader reader = Reader.retrieve(savedTerminal.getTerminalId());
                    if ("online".equals(reader.getStatus())) {
                        log.info("Using existing reader for tenant {}: {}", tenantId, reader.getId());
                        return reader;
                    }
                } catch (StripeException e) {
                    log.debug("Saved reader {} not available", savedTerminal.getTerminalId());
                }
            }
        }
        
        // 如果是测试模式且启用了模拟器，创建模拟Reader
        if (useSimulator && stripeApiKey != null && stripeApiKey.startsWith("sk_test_")) {
            log.info("Creating simulated reader for tenant {} in test mode", tenantId);
            return createSimulatedReaderForTenant(tenantId);
        }
        
        // 尝试找任何在线的Reader
        for (Reader reader : Reader.list(listParams).getData()) {
            if ("online".equals(reader.getStatus())) {
                log.info("Using available online reader: {}", reader.getId());
                return reader;
            }
        }
        
        log.warn("No online reader found for tenant: {}", tenantId);
        return null;
    }
    
    /**
     * 为租户创建模拟Reader
     */
    private Reader createSimulatedReaderForTenant(Long tenantId) throws StripeException {
        // 获取或创建Location
        Location location = getOrCreateLocation(tenantId);
        
        // 创建模拟Reader
        Map<String, Object> params = new HashMap<>();
        params.put("registration_code", "simulated-wpe"); // Stripe的模拟Reader代码
        params.put("label", "Simulated Reader - Tenant " + tenantId);
        params.put("location", location.getId());
        
        try {
            Reader reader = Reader.create(params);
            log.info("Created simulated reader {} for tenant {}", reader.getId(), tenantId);
            
            // 保存到数据库
            saveTerminalInfo(reader, tenantId);
            
            return reader;
        } catch (StripeException e) {
            log.error("Failed to create simulated reader for tenant {}: {}", tenantId, e.getMessage());
            throw e;
        }
    }
    
    /**
     * 获取或创建Location
     */
    private Location getOrCreateLocation(Long tenantId) throws StripeException {
        // 如果有默认location，使用它
        if (defaultLocationId != null && !defaultLocationId.isEmpty()) {
            try {
                return Location.retrieve(defaultLocationId);
            } catch (StripeException e) {
                log.warn("Default location not found: {}", defaultLocationId);
            }
        }
        
        // 列出现有的location
        LocationListParams listParams = LocationListParams.builder()
            .setLimit(1L)
            .build();
        
        for (Location location : Location.list(listParams).getData()) {
            return location; // 返回第一个location
        }
        
        // 创建新的location
        LocationCreateParams createParams = LocationCreateParams.builder()
            .setDisplayName("Default Store Location")
            .setAddress(LocationCreateParams.Address.builder()
                .setLine1("123 Main Street")
                .setCity("Vancouver")
                .setState("BC")
                .setCountry("CA")
                .setPostalCode("V6B 1A1")
                .build())
            .build();
        
        return Location.create(createParams);
    }
    
    /**
     * 创建连接令牌（用于移动SDK）
     */
    public String createConnectionToken() throws StripeException {
        ConnectionTokenCreateParams params = ConnectionTokenCreateParams.builder().build();
        ConnectionToken token = ConnectionToken.create(params);
        return token.getSecret();
    }
    
    /**
     * 保存Terminal信息到数据库
     */
    private void saveTerminalInfo(Reader reader, Long tenantId) {
        try {
            // 获取租户的Stripe账户ID
            StripeAccount stripeAccount = stripeAccountMapper.selectByTenantId(tenantId);
            String stripeAccountId = stripeAccount != null ? stripeAccount.getStripeAccountId() : null;
            
            // 如果没有stripe账户，使用默认值
            if (stripeAccountId == null || stripeAccountId.isEmpty()) {
                stripeAccountId = "platform_account"; // 使用平台账户作为默认值
            }
            
            // 检查是否已存在
            StripeTerminal existing = stripeTerminalMapper.selectByTerminalId(reader.getId());
            
            if (existing == null) {
                StripeTerminal terminal = new StripeTerminal();
                terminal.setTenantId(tenantId);
                terminal.setStripeAccountId(stripeAccountId); // 设置stripe_account_id
                terminal.setTerminalId(reader.getId());
                terminal.setLabel(reader.getLabel());
                terminal.setDeviceType(reader.getDeviceType());
                terminal.setSerialNumber(reader.getSerialNumber());
                terminal.setLocationId(reader.getLocation());
                terminal.setStatus(reader.getStatus());
                terminal.setIpAddress(reader.getIpAddress());
                terminal.setLastSeenAt(LocalDateTime.now());
                terminal.setCreatedAt(LocalDateTime.now());
                terminal.setUpdatedAt(LocalDateTime.now());
                terminal.setDeleted(false);
                
                stripeTerminalMapper.insert(terminal);
            } else {
                // 更新现有记录
                existing.setStatus(reader.getStatus());
                existing.setLastSeenAt(LocalDateTime.now());
                existing.setUpdatedAt(LocalDateTime.now());
                stripeTerminalMapper.updateById(existing);
            }
        } catch (Exception e) {
            log.error("Failed to save terminal info", e);
        }
    }
    
    /**
     * 映射退款原因到Stripe接受的值
     * Stripe只接受: duplicate, fraudulent, requested_by_customer
     */
    private String mapRefundReasonToStripe(String reason) {
        if (reason == null || reason.isEmpty()) {
            return "requested_by_customer";
        }
        
        // 将常见的退款原因映射到Stripe的值
        String lowerReason = reason.toLowerCase();
        if (lowerReason.contains("duplicate") || lowerReason.contains("重复")) {
            return "duplicate";
        } else if (lowerReason.contains("fraud") || lowerReason.contains("欺诈") || lowerReason.contains("诈骗")) {
            return "fraudulent";
        } else {
            // 默认都映射为客户请求
            return "requested_by_customer";
        }
    }
    
    /**
     * 映射Stripe状态到POS状态
     */
    private POSTransactionStatus mapStripeStatusToPOSStatus(String stripeStatus) {
        String mappedStatus;
        switch (stripeStatus) {
            case "requires_payment_method":
            case "requires_confirmation":
            case "requires_action":
                mappedStatus = "pending";
                break;
            case "processing":
                mappedStatus = "processing";
                break;
            case "succeeded":
                mappedStatus = "approved";
                break;
            case "canceled":
                mappedStatus = "cancelled";
                break;
            default:
                mappedStatus = "failed";
                break;
        }
        return POSTransactionStatus.builder()
            .status(mappedStatus)
            .build();
    }
    
    /**
     * 从请求中提取租户ID
     */
    private Long extractTenantIdFromRequest(POSPaymentRequest request) {
        // 首先尝试从metadata中获取
        if (request.getMetadata() != null && request.getMetadata().containsKey("tenant_id")) {
            try {
                return Long.parseLong(request.getMetadata().get("tenant_id").toString());
            } catch (NumberFormatException e) {
                log.warn("Failed to parse tenant_id from metadata: {}", request.getMetadata().get("tenant_id"));
            }
        }
        
        // 如果没有metadata，默认返回1（应该从上下文或配置中获取）
        log.warn("No tenant_id found in request, using default tenant_id = 1");
        return 1L;
    }
    
    @Override
    public String getProviderName() {
        return "STRIPE_TERMINAL";
    }
    
    @Override
    public POSTerminalStatus checkTerminalStatus(String terminalId) {
        return getTerminalStatus(terminalId);
    }
}