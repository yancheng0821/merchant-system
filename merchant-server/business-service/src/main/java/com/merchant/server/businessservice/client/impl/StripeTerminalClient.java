package com.merchant.server.businessservice.client.impl;

import com.merchant.server.businessservice.client.AbstractPOSClient;
import com.merchant.server.businessservice.dto.pos.*;
import com.merchant.server.businessservice.entity.POSTransaction;
import com.merchant.server.businessservice.entity.StripeAccount;
import com.merchant.server.businessservice.entity.StripeTerminal;
import com.merchant.server.businessservice.mapper.POSTransactionMapper;
import com.merchant.server.businessservice.mapper.StripeAccountMapper;
import com.merchant.server.businessservice.mapper.StripeTerminalMapper;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Charge;
import com.stripe.model.ChargeCollection;
import com.stripe.model.PaymentIntent;
import com.stripe.model.PaymentMethod;
import com.stripe.model.Refund;
import com.stripe.model.terminal.ConnectionToken;
import com.stripe.model.terminal.Location;
import com.stripe.model.terminal.Reader;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
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
import java.time.ZoneOffset;
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
    private final POSTransactionMapper posTransactionMapper;
    
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
            // 根据前端选择的支付方式设置正确的Stripe payment method types
            PaymentIntentCreateParams.Builder paramsBuilder = PaymentIntentCreateParams.builder()
                .setAmount(request.getAmount().multiply(BigDecimal.valueOf(100)).longValue()) // 转换为分
                .setCurrency(request.getCurrency() != null ? request.getCurrency() : "cad")
                .setCaptureMethod(PaymentIntentCreateParams.CaptureMethod.AUTOMATIC)
                .putMetadata("order_id", request.getOrderId())
                .putMetadata("tenant_id", tenantId.toString())
                .putMetadata("terminal_id", request.getTerminalId())
                .putMetadata("_stripe_terminal_payment", "true"); // 标记这是Terminal支付
            
            // 根据支付方式添加相应的payment method types
            String requestedPaymentMethod = request.getPaymentMethod();
            if ("debit_card".equalsIgnoreCase(requestedPaymentMethod)) {
                // 借记卡：添加 interac_present（加拿大本地借记卡）和 card_present（国际借记卡）
                paramsBuilder.addPaymentMethodType("interac_present");
                paramsBuilder.addPaymentMethodType("card_present");
                log.info("Payment method set to debit cards (interac_present + card_present)");
            } else if ("credit_card".equalsIgnoreCase(requestedPaymentMethod)) {
                // 信用卡：只添加 card_present
                paramsBuilder.addPaymentMethodType("card_present");
                log.info("Payment method set to credit cards only (card_present)");
            } else {
                // 默认或其他：接受所有类型
                paramsBuilder.addPaymentMethodType("card_present");
                paramsBuilder.addPaymentMethodType("interac_present");
                log.info("Payment method set to all card types (card_present + interac_present)");
            }
            
            // 对于Terminal支付，必须在Reader所在的账户创建PaymentIntent
            // 在多租户SaaS平台中，Reader总是在connected account中，
            // 所以PaymentIntent也必须在connected account中创建
            PaymentIntent paymentIntent;
            
            if (stripeAccount != null && stripeAccount.getStripeAccountId() != null) {
                // 必须在connected account中创建PaymentIntent
                // 因为Reader在connected account中注册
                RequestOptions requestOptions = RequestOptions.builder()
                    .setStripeAccount(stripeAccount.getStripeAccountId())
                    .build();
                
                PaymentIntentCreateParams params = paramsBuilder
                    .setPaymentMethodOptions(
                        PaymentIntentCreateParams.PaymentMethodOptions.builder()
                            .setCardPresent(
                                PaymentIntentCreateParams.PaymentMethodOptions.CardPresent.builder()
                                    .build()
                            )
                            .build()
                    )
                    .build();
                
                paymentIntent = PaymentIntent.create(params, requestOptions);
                log.info("Created PaymentIntent {} in connected account {} for tenant {}", 
                    paymentIntent.getId(), stripeAccount.getStripeAccountId(), tenantId);
            } else {
                // 如果没有connected account，在平台账户创建（仅用于测试）
                PaymentIntentCreateParams params = paramsBuilder.build();
                paymentIntent = PaymentIntent.create(params);
                log.info("Created PaymentIntent {} in platform account for tenant {} (no connected account)", 
                    paymentIntent.getId(), tenantId);
            }
            
            // 获取或创建Terminal Reader
            Reader reader = getOrCreateReader(request.getTerminalId(), tenantId);
            
            // 处理支付
            if (reader != null && reader.getStatus().equals("online")) {
                log.info("Got reader {} with status {} for payment. PaymentIntent: {}", 
                    reader.getId(), reader.getStatus(), paymentIntent.getId());
                log.info("Reader device type: {}, livemode: {}", 
                    reader.getDeviceType(), reader.getLivemode());
                
                
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
                        // 对于connected account的reader，需要使用正确的RequestOptions
                        if (stripeAccount != null && stripeAccount.getStripeAccountId() != null) {
                            RequestOptions requestOptions = RequestOptions.builder()
                                .setStripeAccount(stripeAccount.getStripeAccountId())
                                .build();
                            
                            log.info("Processing payment in connected account: {}", stripeAccount.getStripeAccountId());
                            log.info("PaymentIntent ID: {}, Reader ID: {}", paymentIntent.getId(), reader.getId());
                            
                            
                            // 重新获取reader确保在正确的账户上下文中
                            Reader connectedReader = Reader.retrieve(reader.getId(), requestOptions);
                            
                            // 构建processPaymentIntent参数
                            Map<String, Object> params = new HashMap<>();
                            params.put("payment_intent", paymentIntent.getId());
                            
                            // 使用testHelperProcessPaymentIntent方法（如果在测试模式）
                            // 或者使用标准的processPaymentIntent方法
                            try {
                                // 尝试使用Stripe提供的processPaymentIntent方法
                                // 注意：这里我们需要确保RequestOptions被正确传递
                                ReaderProcessPaymentIntentParams processParams = ReaderProcessPaymentIntentParams.builder()
                                    .setPaymentIntent(paymentIntent.getId())
                                    .build();
                                
                                // 调用processPaymentIntent，显式传递RequestOptions
                                // 这应该会在HTTP请求中包含Stripe-Account header
                                connectedReader = connectedReader.processPaymentIntent(processParams, requestOptions);
                                
                                log.info("✓ Payment processing initiated on reader {} in connected account {}", 
                                    connectedReader.getId(), stripeAccount.getStripeAccountId());
                                
                                reader = connectedReader;
                            } catch (StripeException e) {
                                log.error("Failed to process payment with RequestOptions: {}", e.getMessage());
                                // 如果上面失败，尝试另一种方法
                                throw e;
                            }
                        } else {
                            // 平台账户的reader
                            ReaderProcessPaymentIntentParams processParams = ReaderProcessPaymentIntentParams.builder()
                                .setPaymentIntent(paymentIntent.getId())
                                .build();
                            
                            reader = reader.processPaymentIntent(processParams);
                            log.info("Payment processing initiated on reader {} in platform account", 
                                reader.getId());
                        }
                        
                        log.info("Payment processing status: {}", 
                            reader.getAction() != null ? reader.getAction().getStatus() : "unknown");
                        
                    } catch (StripeException e) {
                        log.error("Failed to process payment on reader: {}", e.getMessage());
                        log.error("Full error details: ", e);
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
                .initiatedAt(LocalDateTime.now(ZoneOffset.UTC))
                .build();
                
        } catch (StripeException e) {
            log.error("Stripe Terminal payment initiation failed", e);
            // 当支付初始化失败时，使用特殊的transaction ID格式来表示失败
            // 不要使用orderId作为transactionId，避免后续查询出错
            String failedTransactionId = "failed_" + request.getOrderId() + "_" + System.currentTimeMillis();
            return POSInitResponse.builder()
                .transactionId(failedTransactionId)
                .status("failed")
                .message("Payment initiation failed: " + e.getMessage())
                .initiatedAt(LocalDateTime.now(ZoneOffset.UTC))
                .build();
        }
    }
    
    @Override
    public POSTransactionStatus queryTransactionStatus(String transactionId) {
        log.info("Querying Stripe payment status for transaction: {}", transactionId);
        
        // 处理失败的transaction ID（格式: failed_orderId_timestamp）
        if (transactionId != null && transactionId.startsWith("failed_")) {
            log.info("Transaction {} was a failed initialization, returning failed status", transactionId);
            return POSTransactionStatus.builder()
                .transactionId(transactionId)
                .status("failed")
                .errorMessage("Payment initialization failed")
                .build();
        }
        
        try {
            // 从transactionId提取metadata来获取tenant_id
            // 首先尝试从数据库获取交易记录，其中包含tenant信息
            POSTransaction posTransaction = posTransactionMapper.selectByTransactionId(transactionId);
            PaymentIntent paymentIntent = null;
            
            // 用于存储Reader的失败信息
            String readerFailureMessage = null;
            String readerFailureCode = null;
            
            if (posTransaction != null && posTransaction.getTenantId() != null) {
                // 获取商户的Stripe账户
                StripeAccount stripeAccount = stripeAccountMapper.selectByTenantId(posTransaction.getTenantId());
                
                if (stripeAccount != null && stripeAccount.getStripeAccountId() != null) {
                    // 在connected account中查询
                    RequestOptions requestOptions = RequestOptions.builder()
                        .setStripeAccount(stripeAccount.getStripeAccountId())
                        .build();
                    
                    try {
                        paymentIntent = PaymentIntent.retrieve(transactionId, requestOptions);
                        log.debug("Found PaymentIntent {} in connected account {}", 
                            transactionId, stripeAccount.getStripeAccountId());
                        
                        // 检查是否有使用的Terminal，如果有，检查Reader的状态
                        if (posTransaction.getPosTerminalId() != null) {
                            try {
                                Reader reader = Reader.retrieve(posTransaction.getPosTerminalId(), requestOptions);
                                if (reader.getAction() != null && 
                                    "failed".equals(reader.getAction().getStatus())) {
                                    readerFailureMessage = reader.getAction().getFailureMessage();
                                    readerFailureCode = reader.getAction().getFailureCode();
                                    log.info("Reader {} has failed action: {} - {}", 
                                        reader.getId(), readerFailureCode, readerFailureMessage);
                                }
                            } catch (Exception e) {
                                log.debug("Could not retrieve reader status: {}", e.getMessage());
                            }
                        }
                    } catch (StripeException e) {
                        log.debug("PaymentIntent not found in connected account {}: {}", 
                            stripeAccount.getStripeAccountId(), e.getMessage());
                    }
                }
            }
            
            // 如果在connected account找不到，尝试平台账户（仅用于向后兼容）
            if (paymentIntent == null) {
                try {
                    paymentIntent = PaymentIntent.retrieve(transactionId);
                    log.debug("Found PaymentIntent {} in platform account", transactionId);
                } catch (StripeException e) {
                    log.debug("PaymentIntent not found in platform account: {}", e.getMessage());
                }
            }
            
            // 如果都找不到，返回pending状态
            if (paymentIntent == null) {
                log.warn("PaymentIntent {} not found in any account", transactionId);
                
                // 返回pending状态，让系统继续轮询
                return POSTransactionStatus.builder()
                    .transactionId(transactionId)
                    .status("pending")
                    .build();
            }
            
            // 检查是否有支付错误（被拒绝的支付）
            if (paymentIntent.getLastPaymentError() != null) {
                log.info("PaymentIntent {} has payment error: {}", 
                    transactionId, paymentIntent.getLastPaymentError().getMessage());
                
                // 如果有支付错误，返回failed状态
                return POSTransactionStatus.builder()
                    .transactionId(transactionId)
                    .status("failed")
                    .errorMessage(paymentIntent.getLastPaymentError().getMessage())
                    .errorCode(paymentIntent.getLastPaymentError().getCode())
                    .build();
            }
            
            // 没有错误时，正常映射状态
            POSTransactionStatus status = mapStripeStatusToPOSStatus(paymentIntent.getStatus());
            status.setTransactionId(transactionId);
            
            // 检查Reader是否有失败信息（比如不支持的支付方式）
            if (readerFailureMessage != null) {
                log.info("Payment failed due to reader error: {}", readerFailureMessage);
                status.setStatus("failed");
                status.setErrorMessage(readerFailureMessage);
                status.setErrorCode(readerFailureCode);
                return status;
            }
            
            // 如果状态是requires_payment_method但之前有支付方法历史，可能是被拒绝了
            // 注意：Stripe Java SDK中PaymentIntent的charges属性需要通过展开参数获取
            // 这里简化处理，直接检查是否有之前的支付方法
            if ("requires_payment_method".equals(paymentIntent.getStatus()) && 
                paymentIntent.getPaymentMethod() != null) {
                // 如果状态是requires_payment_method但有payment_method，通常表示之前的支付失败了
                log.info("PaymentIntent {} requires new payment method after failed attempt", transactionId);
                status.setStatus("failed");
                status.setErrorMessage("Payment declined, please try another payment method");
            }
            
            return status;
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
            // 首先需要确定这个PaymentIntent属于哪个子商户
            // 通过查询数据库获取原始交易信息
            POSTransaction originalTransaction = posTransactionMapper.selectByTransactionId(request.getOriginalTransactionId());
            RequestOptions requestOptions = null;
            
            if (originalTransaction != null && originalTransaction.getTenantId() != null) {
                // 获取商户的Stripe账户
                StripeAccount stripeAccount = stripeAccountMapper.selectByTenantId(originalTransaction.getTenantId());
                if (stripeAccount != null && stripeAccount.getStripeAccountId() != null) {
                    // 设置RequestOptions以在子商户账户中执行退款
                    requestOptions = RequestOptions.builder()
                        .setStripeAccount(stripeAccount.getStripeAccountId())
                        .build();
                    log.info("Processing refund in connected account: {} for tenant: {}", 
                        stripeAccount.getStripeAccountId(), originalTransaction.getTenantId());
                }
            } else {
                log.warn("Could not find original transaction or tenant info for refund: {}", 
                    request.getOriginalTransactionId());
            }
            
            // 首先获取原始PaymentIntent以确定支付方式
            PaymentIntent originalPaymentIntent = null;
            String paymentMethodId = null;
            
            try {
                // 需要展开charges信息以获取支付方式详情
                Map<String, Object> params = new HashMap<>();
                params.put("expand[]", "charges");
                
                if (requestOptions != null) {
                    originalPaymentIntent = PaymentIntent.retrieve(request.getOriginalTransactionId(), params, requestOptions);
                } else {
                    originalPaymentIntent = PaymentIntent.retrieve(request.getOriginalTransactionId(), params, null);
                }
                paymentMethodId = originalPaymentIntent.getPaymentMethod();
                log.info("Original PaymentIntent {} used payment method: {}", 
                    request.getOriginalTransactionId(), paymentMethodId);
            } catch (Exception e) {
                log.warn("Could not retrieve original PaymentIntent details: {}", e.getMessage());
            }
            
            // 使用 RefundCreateParams 创建退款
            // 对于 Terminal 支付，Stripe 会自动从原始 PaymentIntent 获取 payment_method_data
            log.info("Processing refund for PaymentIntent: {}", request.getOriginalTransactionId());
            
            // 映射退款原因到Stripe接受的值
            RefundCreateParams.Reason refundReason = mapRefundReasonToStripeEnum(request.getReason());
            
            // 构建退款参数
            RefundCreateParams.Builder refundParamsBuilder = RefundCreateParams.builder()
                .setPaymentIntent(request.getOriginalTransactionId())
                .setReason(refundReason);
            
            // 如果指定了退款金额，添加金额参数
            if (request.getRefundAmount() != null) {
                refundParamsBuilder.setAmount(request.getRefundAmount().multiply(BigDecimal.valueOf(100)).longValue());
            }
            
            RefundCreateParams refundParams = refundParamsBuilder.build();
            
            // 记录调试信息
            log.info("Creating refund with params: PaymentIntent={}, Amount={}", 
                request.getOriginalTransactionId(), 
                request.getRefundAmount());
            
            // 使用RequestOptions创建退款（如果有的话）
            Refund refund;
            if (requestOptions != null) {
                refund = Refund.create(refundParams, requestOptions);
                log.info("Refund created in connected account: {}", refund.getId());
            } else {
                refund = Refund.create(refundParams);
                log.info("Refund created in platform account (fallback): {}", refund.getId());
            }
            
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
                .lastHeartbeat(LocalDateTime.now(ZoneOffset.UTC))
                .build();
        } catch (StripeException e) {
            log.error("Failed to get terminal status", e);
            return POSTerminalStatus.builder()
                .terminalId(terminalId)
                .status("offline")
                .connected(false)
                .lastHeartbeat(LocalDateTime.now(ZoneOffset.UTC))
                .build();
        }
    }
    
    /**
     * 获取或创建Terminal Reader
     */
    private Reader getOrCreateReader(String terminalId, Long tenantId) throws StripeException {
        // 获取商户的Stripe账户以确定context
        StripeAccount stripeAccount = stripeAccountMapper.selectByTenantId(tenantId);
        RequestOptions requestOptions = null;
        
        // 如果有connected account，创建RequestOptions
        if (stripeAccount != null && stripeAccount.getStripeAccountId() != null 
            && !stripeAccount.getStripeAccountId().isEmpty()) {
            requestOptions = RequestOptions.builder()
                .setStripeAccount(stripeAccount.getStripeAccountId())
                .build();
            log.debug("Using connected account context: {}", stripeAccount.getStripeAccountId());
        }
        
        // 如果提供了特定的terminalId，尝试获取它
        if (terminalId != null && !terminalId.isEmpty() && !terminalId.equals("POS-001")) {
            try {
                // 在多租户SaaS平台中，Reader 总是属于 connected account
                if (requestOptions != null) {
                    log.debug("Retrieving reader {} from connected account: {}", terminalId, stripeAccount.getStripeAccountId());
                    return Reader.retrieve(terminalId, requestOptions);
                } else {
                    log.error("No connected account found for tenant {}, cannot retrieve reader", tenantId);
                    throw new RuntimeException("No connected account found for tenant " + tenantId);
                }
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
                    // 在多租户SaaS平台中，Reader 总是属于 connected account
                    if (requestOptions != null) {
                        Reader reader = Reader.retrieve(savedTerminal.getTerminalId(), requestOptions);
                        if (reader != null && "online".equals(reader.getStatus())) {
                            log.info("Using existing reader for tenant {}: {}", tenantId, reader.getId());
                            return reader;
                        }
                    } else {
                        log.warn("No connected account for tenant {}, skipping reader {}", 
                                tenantId, savedTerminal.getTerminalId());
                    }
                } catch (StripeException e) {
                    log.debug("Saved reader {} not available: {}", savedTerminal.getTerminalId(), e.getMessage());
                }
            }
        }
        
        // 如果是测试模式且启用了模拟器，创建模拟Reader
        if (useSimulator && stripeApiKey != null && stripeApiKey.startsWith("sk_test_")) {
            log.info("Creating simulated reader for tenant {} in test mode", tenantId);
            return createSimulatedReaderForTenant(tenantId);
        }
        
        // 尝试找任何在线的Reader（使用connected account context）
        if (requestOptions != null) {
            for (Reader reader : Reader.list(listParams, requestOptions).getData()) {
                if ("online".equals(reader.getStatus())) {
                    log.info("Using available online reader: {}", reader.getId());
                    return reader;
                }
            }
        } else {
            log.warn("No connected account for tenant {}, cannot list readers", tenantId);
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
                terminal.setLastSeenAt(LocalDateTime.now(ZoneOffset.UTC));
                terminal.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
                terminal.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
                terminal.setDeleted(false);
                
                stripeTerminalMapper.insert(terminal);
            } else {
                // 更新现有记录
                existing.setStatus(reader.getStatus());
                existing.setLastSeenAt(LocalDateTime.now(ZoneOffset.UTC));
                existing.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
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
    
    private RefundCreateParams.Reason mapRefundReasonToStripeEnum(String reason) {
        if (reason == null || reason.isEmpty()) {
            return RefundCreateParams.Reason.REQUESTED_BY_CUSTOMER;
        }
        
        // 如果reason包含管道符，说明是从前端传过来的格式化字符串
        if (reason.contains("|")) {
            String stripeValue = reason.split("\\|")[0];
            if ("duplicate".equals(stripeValue)) {
                return RefundCreateParams.Reason.DUPLICATE;
            } else if ("fraudulent".equals(stripeValue)) {
                return RefundCreateParams.Reason.FRAUDULENT;
            }
        }
        
        // 将常见的退款原因映射到Stripe的枚举
        String lowerReason = reason.toLowerCase();
        if (lowerReason.contains("duplicate") || lowerReason.contains("重复")) {
            return RefundCreateParams.Reason.DUPLICATE;
        } else if (lowerReason.contains("fraud") || lowerReason.contains("欺诈") || lowerReason.contains("诈骗")) {
            return RefundCreateParams.Reason.FRAUDULENT;
        } else {
            // 默认都映射为客户请求
            return RefundCreateParams.Reason.REQUESTED_BY_CUSTOMER;
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
            case "cancelled":  // Stripe可能返回两种拼写
                mappedStatus = "cancelled";
                break;
            case "requires_capture":  // 需要捕获的支付
                mappedStatus = "processing";
                break;
            default:
                log.warn("Unknown Stripe payment status: {}, mapping to failed", stripeStatus);
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