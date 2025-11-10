package com.merchant.server.businessservice.service.impl;

import com.merchant.server.businessservice.dto.stripe.*;
import com.merchant.server.businessservice.entity.*;
import com.merchant.server.businessservice.mapper.*;
import com.merchant.server.businessservice.service.StripeConnectService;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.*;
import com.stripe.model.LoginLink;
import com.stripe.model.terminal.Location;
import com.stripe.model.terminal.Reader;
import com.stripe.net.RequestOptions;
import com.stripe.net.Webhook;
import com.stripe.param.*;
import com.stripe.param.AccountUpdateParams;
import com.stripe.param.terminal.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.ZoneId;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Stripe Connect 多租户支付服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StripeConnectServiceImpl implements StripeConnectService {
    
    private final StripeAccountMapper stripeAccountMapper;
    private final StripeTerminalMapper stripeTerminalMapper;
    private final StripeLocationMapper stripeLocationMapper;
    private final StripePaymentIntentMapper stripePaymentIntentMapper;
    private final OrderMapper orderMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Value("${stripe.api.key:sk_test_PLACEHOLDER}")
    private String stripeApiKey;
    
    @Value("${stripe.webhook.secret:whsec_PLACEHOLDER}")
    private String webhookSecret;
    
    @Value("${stripe.platform.fee.percentage:2.5}")
    private Double platformFeePercentage;
    
    @Value("${stripe.connect.client.id:ca_PLACEHOLDER}")
    private String stripeClientId;
    
    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
        log.info("Stripe Connect service initialized");
    }
    
    @Value("${feign.client.config.auth-service.url:http://localhost:8081}")
    private String authServiceUrl;
    
    @Override
    @Transactional
    public StripeAccountDTO createConnectAccount(Long tenantId, CreateStripeAccountRequest request) {
        log.info("Creating Stripe Connect account for tenant: {}", tenantId);
        
        // 只检查未删除的账户
        StripeAccount existingAccount = stripeAccountMapper.selectByTenantId(tenantId);
        if (existingAccount != null) {
            // 如果账户未删除，检查Stripe中是否还存在
            try {
                Account stripeCheck = Account.retrieve(existingAccount.getStripeAccountId());
                log.info("Stripe account already exists and is active for tenant: {}", tenantId);
                return convertToDTO(existingAccount);
            } catch (StripeException e) {
                // Stripe账户不存在，但数据库有记录，这是异常情况
                log.error("Database has account but Stripe doesn't, this is an inconsistent state: {}", e.getMessage());
                throw new RuntimeException("Stripe account is in inconsistent state. Please contact support.");
            }
        }
        
        // 检查是否有已删除的账户记录（仅用于日志记录）
        StripeAccount deletedAccount = stripeAccountMapper.selectByTenantIdIncludeDeleted(tenantId);
        if (deletedAccount != null && deletedAccount.getDeleted()) {
            log.info("Found deleted Stripe account record for tenant: {}, will create a new one", tenantId);
        }
        
        try {
            // 创建Stripe Connect账户时预填充商户信息
            AccountCreateParams.Builder paramsBuilder = AccountCreateParams.builder()
                .setType(AccountCreateParams.Type.valueOf(request.getAccountType().toUpperCase()))
                .setCountry(request.getCountry())
                .setEmail(request.getEmail())
                .putMetadata("tenant_id", tenantId.toString())
                .putMetadata("business_name", request.getBusinessName());
            
            // 根据业务类型决定填充公司信息还是个人信息
            // 目前默认使用公司类型，因为大多数商户都是企业
            paramsBuilder.setBusinessType(AccountCreateParams.BusinessType.COMPANY);
            
            // 预填充商户公司信息
            if (request.getBusinessName() != null) {
                AccountCreateParams.Company.Builder companyBuilder = AccountCreateParams.Company.builder()
                    .setName(request.getBusinessName());
                
                // 只有当电话号码非空时才设置
                if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
                    companyBuilder.setPhone(request.getPhone());
                }
                
                // 构建地址信息
                AccountCreateParams.Company.Address.Builder addressBuilder = AccountCreateParams.Company.Address.builder()
                    .setCountry(request.getCountry());
                
                if (request.getAddress() != null && !request.getAddress().trim().isEmpty()) {
                    addressBuilder.setLine1(request.getAddress());
                }
                if (request.getCity() != null && !request.getCity().trim().isEmpty()) {
                    addressBuilder.setCity(request.getCity());
                }
                if (request.getState() != null && !request.getState().trim().isEmpty()) {
                    addressBuilder.setState(request.getState());
                }
                if (request.getPostalCode() != null && !request.getPostalCode().trim().isEmpty()) {
                    addressBuilder.setPostalCode(request.getPostalCode());
                }
                
                companyBuilder.setAddress(addressBuilder.build());
                paramsBuilder.setCompany(companyBuilder.build());
            }
            
            // 注意：individual参数只能用于business_type为'individual'的账户
            // 对于公司账户，联系人信息应该在company对象中设置或在onboarding流程中填写
            
            // 设置业务信息
            AccountCreateParams.BusinessProfile businessProfile = AccountCreateParams.BusinessProfile.builder()
                .setName(request.getBusinessName())
                .setProductDescription(request.getProductDescription())
                .setMcc(request.getMcc()) // Merchant Category Code
                .setUrl(request.getWebsite())
                .build();
            paramsBuilder.setBusinessProfile(businessProfile);
            
            // 请求支付和转账能力
            AccountCreateParams.Capabilities capabilities = AccountCreateParams.Capabilities.builder()
                .setCardPayments(AccountCreateParams.Capabilities.CardPayments.builder()
                    .setRequested(true)
                    .build())
                .setTransfers(AccountCreateParams.Capabilities.Transfers.builder()
                    .setRequested(true)
                    .build())
                .build();
            paramsBuilder.setCapabilities(capabilities);
            
            // 注意：银行账户信息通常在onboarding流程中填写，不在创建时设置
            // 这是为了安全考虑，银行信息应该在Stripe的安全页面上输入
            
            Account stripeAccount = Account.create(paramsBuilder.build());
            
            // 总是创建新记录（避免外键约束问题）
            StripeAccount account = new StripeAccount();
            account.setTenantId(tenantId);
            account.setStripeAccountId(stripeAccount.getId());
            account.setAccountType(request.getAccountType());
            account.setBusinessName(request.getBusinessName());
            account.setBusinessType(request.getBusinessType());
            account.setCountry(request.getCountry());
            account.setDefaultCurrency(request.getDefaultCurrency());
            account.setOnboardingCompleted(false);
            account.setChargesEnabled(stripeAccount.getChargesEnabled());
            account.setPayoutsEnabled(stripeAccount.getPayoutsEnabled());
            account.setDetailsSubmitted(stripeAccount.getDetailsSubmitted());
            account.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
            account.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
            account.setDeleted(false);
            
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("stripe_created", stripeAccount.getCreated());
            metadata.put("prefilled", true);
            // 如果有已删除的旧账户，记录重新激活信息
            if (deletedAccount != null) {
                metadata.put("reactivated", true);
                metadata.put("previous_account_id", deletedAccount.getStripeAccountId());
            }
            account.setMetadata(convertToJson(metadata));
            
            stripeAccountMapper.insert(account);
            
            log.info("Successfully created Stripe Connect account with prefilled info: {}", stripeAccount.getId());
            return convertToDTO(account);
            
        } catch (StripeException e) {
            log.error("Failed to create Stripe Connect account", e);
            throw new RuntimeException("Failed to create Stripe Connect account: " + e.getMessage());
        }
    }
    
    @Override
    public AccountLinkDTO createAccountLink(Long tenantId, String returnUrl, String refreshUrl) {
        log.info("Creating account link for tenant: {}", tenantId);
        
        StripeAccount account = stripeAccountMapper.selectByTenantId(tenantId);
        if (account == null) {
            throw new RuntimeException("Stripe account not found for tenant: " + tenantId);
        }
        
        try {
            // 先验证账户是否在Stripe中存在
            try {
                Account stripeAccount = Account.retrieve(account.getStripeAccountId());
                log.info("Stripe account {} exists with status - charges: {}, payouts: {}", 
                    stripeAccount.getId(), stripeAccount.getChargesEnabled(), stripeAccount.getPayoutsEnabled());
            } catch (StripeException verifyException) {
                log.error("Stripe account {} not found in Stripe, may need to recreate", account.getStripeAccountId());
                throw new RuntimeException("Stripe account not found. Please try creating a new account.");
            }
            
            AccountLinkCreateParams params = AccountLinkCreateParams.builder()
                .setAccount(account.getStripeAccountId())
                .setReturnUrl(returnUrl)
                .setRefreshUrl(refreshUrl)
                .setType(AccountLinkCreateParams.Type.ACCOUNT_ONBOARDING)
                .build();
            
            AccountLink accountLink = AccountLink.create(params);
            
            // 更新账户的URL信息
            account.setOnboardingUrl(accountLink.getUrl());
            account.setReturnUrl(returnUrl);
            account.setRefreshUrl(refreshUrl);
            account.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
            stripeAccountMapper.updateById(account);
            
            return AccountLinkDTO.builder()
                .url(accountLink.getUrl())
                .expiresAt(LocalDateTime.ofInstant(
                    Instant.ofEpochSecond(accountLink.getExpiresAt()), 
                    ZoneId.systemDefault()))
                .type("account_onboarding")
                .build();
                
        } catch (StripeException e) {
            log.error("Failed to create account link", e);
            throw new RuntimeException("Failed to create account link: " + e.getMessage());
        }
    }
    
    @Override
    @Transactional
    public StripeAccountDTO handleOAuthCallback(Long tenantId, String code) {
        log.info("Handling OAuth callback for tenant: {} with code: {}", tenantId, code);
        
        // OAuth流程通常用于Standard账户类型
        // 这里简化处理，实际应使用OAuth token exchange
        StripeAccount account = stripeAccountMapper.selectByTenantId(tenantId);
        if (account == null) {
            throw new RuntimeException("Stripe account not found for tenant: " + tenantId);
        }
        
        // 更新账户状态
        return syncAccountStatus(tenantId);
    }
    
    @Override
    public StripeAccountDTO getStripeAccount(Long tenantId) {
        StripeAccount account = stripeAccountMapper.selectByTenantId(tenantId);
        if (account == null) {
            return null;
        }
        return convertToDTO(account);
    }
    
    @Override
    @Transactional
    public StripeAccountDTO syncAccountStatus(Long tenantId) {
        log.info("Syncing Stripe account status for tenant: {}", tenantId);
        
        StripeAccount account = stripeAccountMapper.selectByTenantId(tenantId);
        if (account == null) {
            throw new RuntimeException("Stripe account not found for tenant: " + tenantId);
        }
        
        try {
            Account stripeAccount = Account.retrieve(account.getStripeAccountId());
            
            // 更新账户状态
            account.setChargesEnabled(stripeAccount.getChargesEnabled());
            account.setPayoutsEnabled(stripeAccount.getPayoutsEnabled());
            account.setDetailsSubmitted(stripeAccount.getDetailsSubmitted());
            
            // 检查是否完成入驻
            // 只有当可以收款AND可以提现时才算完全完成
            if (stripeAccount.getChargesEnabled() && stripeAccount.getPayoutsEnabled()) {
                account.setOnboardingCompleted(true);
            } else if (stripeAccount.getChargesEnabled() && !stripeAccount.getPayoutsEnabled()) {
                // 可以收款但不能提现 - 需要身份验证
                log.info("Account can charge but not payout - identity verification needed");
            }
            
            // 记录验证要求并保存到账户信息中
            List<String> pendingVerification = null;
            boolean requiresAction = false;
            
            if (stripeAccount.getRequirements() != null) {
                List<String> currentlyDue = stripeAccount.getRequirements().getCurrentlyDue();
                if (currentlyDue != null && !currentlyDue.isEmpty()) {
                    pendingVerification = currentlyDue;
                    requiresAction = true;
                    log.info("Account {} has pending requirements: {}", 
                        account.getStripeAccountId(), String.join(", ", currentlyDue));
                }
            }
            
            // 保存待验证项到metadata
            Map<String, Object> metadata = convertFromJson(account.getMetadata(), Map.class);
            if (metadata == null) {
                metadata = new HashMap<>();
            }
            if (pendingVerification != null) {
                metadata.put("pending_verification", pendingVerification);
                metadata.put("requires_action", requiresAction);
            }
            account.setMetadata(convertToJson(metadata));
            
            // 生成Dashboard URL
            if (account.getChargesEnabled()) { // 只要能收款就可以访问Dashboard
                boolean isTestMode = stripeApiKey.startsWith("sk_test");
                String dashboardUrl = String.format(
                    "https://dashboard.stripe.com/%s/connect/accounts/%s",
                    isTestMode ? "test" : "live",
                    account.getStripeAccountId()
                );
                account.setDashboardUrl(dashboardUrl);
            }
            
            account.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
            stripeAccountMapper.updateById(account);
            
            return convertToDTO(account);
            
        } catch (StripeException e) {
            log.error("Failed to sync account status", e);
            throw new RuntimeException("Failed to sync account status: " + e.getMessage());
        }
    }
    
    @Override
    @Transactional
    public PaymentIntentDTO createPaymentIntent(Long tenantId, CreatePaymentIntentRequest request) {
        log.info("Creating payment intent for tenant: {}, order: {}", tenantId, request.getOrderId());
        
        // 获取租户的Stripe账户
        StripeAccount account = stripeAccountMapper.selectByTenantId(tenantId);
        if (account == null || !account.getChargesEnabled()) {
            throw new RuntimeException("Stripe account not ready for tenant: " + tenantId);
        }
        
        // 获取订单信息
        Order order = orderMapper.selectById(request.getOrderId());
        if (order == null) {
            throw new RuntimeException("Order not found: " + request.getOrderId());
        }
        
        try {
            // 计算平台费用
            Long applicationFee = calculateApplicationFee(request.getAmount());
            
            // 创建Payment Intent
            PaymentIntentCreateParams.Builder paramsBuilder = PaymentIntentCreateParams.builder()
                .setAmount(request.getAmount())
                .setCurrency(request.getCurrency().toLowerCase())
                .setDescription(request.getDescription())
                .setApplicationFeeAmount(applicationFee)
                .putMetadata("tenant_id", tenantId.toString())
                .putMetadata("order_id", request.getOrderId().toString());
            
            // 设置支付方式类型
            if ("card_present".equals(request.getPaymentMethodType())) {
                paramsBuilder.addPaymentMethodType("card_present")
                    .setCaptureMethod(PaymentIntentCreateParams.CaptureMethod.AUTOMATIC);
            } else {
                paramsBuilder.addPaymentMethodType("card");
            }
            
            // 使用Connected Account创建支付
            RequestOptions requestOptions = RequestOptions.builder()
                .setStripeAccount(account.getStripeAccountId())
                .build();
            
            PaymentIntent paymentIntent = PaymentIntent.create(paramsBuilder.build(), requestOptions);
            
            // 保存到数据库
            StripePaymentIntent intent = new StripePaymentIntent();
            intent.setTenantId(tenantId);
            intent.setOrderId(request.getOrderId());
            intent.setStripeAccountId(account.getStripeAccountId());
            intent.setPaymentIntentId(paymentIntent.getId());
            intent.setClientSecret(paymentIntent.getClientSecret());
            intent.setAmount(request.getAmount());
            intent.setCurrency(request.getCurrency());
            intent.setStatus(paymentIntent.getStatus());
            intent.setPaymentMethodType(request.getPaymentMethodType());
            intent.setApplicationFeeAmount(applicationFee);
            intent.setMetadata(convertToJson(request.getMetadata()));
            intent.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
            
            stripePaymentIntentMapper.insert(intent);
            
            // 更新订单
            order.setTransactionId(paymentIntent.getId());
            order.setPaymentStatus("pending");
            order.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
            orderMapper.updateById(order);
            
            return convertToPaymentIntentDTO(intent);
            
        } catch (StripeException e) {
            log.error("Failed to create payment intent", e);
            throw new RuntimeException("Failed to create payment intent: " + e.getMessage());
        }
    }
    
    @Override
    @Transactional
    public PaymentIntentDTO confirmPaymentIntent(Long tenantId, String paymentIntentId) {
        log.info("Confirming payment intent: {} for tenant: {}", paymentIntentId, tenantId);
        
        StripePaymentIntent intent = stripePaymentIntentMapper.selectByPaymentIntentId(paymentIntentId);
        if (intent == null || !intent.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Payment intent not found: " + paymentIntentId);
        }
        
        StripeAccount account = stripeAccountMapper.selectByTenantId(tenantId);
        if (account == null) {
            throw new RuntimeException("Stripe account not found for tenant: " + tenantId);
        }
        
        try {
            RequestOptions requestOptions = RequestOptions.builder()
                .setStripeAccount(account.getStripeAccountId())
                .build();
            
            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId, requestOptions);
            PaymentIntent confirmedIntent = paymentIntent.confirm(requestOptions);
            
            // 更新数据库
            intent.setStatus(confirmedIntent.getStatus());
            if ("succeeded".equals(confirmedIntent.getStatus())) {
                intent.setConfirmedAt(LocalDateTime.now(ZoneOffset.UTC));
            }
            stripePaymentIntentMapper.updateById(intent);
            
            // 更新订单状态
            if ("succeeded".equals(confirmedIntent.getStatus())) {
                Order order = orderMapper.selectById(intent.getOrderId());
                if (order != null) {
                    order.setPaymentStatus("paid");
                    order.setOrderStatus("completed");
                    order.setCompletedAt(LocalDateTime.now(ZoneOffset.UTC));
                    order.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
                    orderMapper.updateById(order);
                }
            }
            
            return convertToPaymentIntentDTO(intent);
            
        } catch (StripeException e) {
            log.error("Failed to confirm payment intent", e);
            throw new RuntimeException("Failed to confirm payment intent: " + e.getMessage());
        }
    }
    
    @Override
    @Transactional
    public PaymentIntentDTO cancelPaymentIntent(Long tenantId, String paymentIntentId) {
        log.info("Canceling payment intent: {} for tenant: {}", paymentIntentId, tenantId);
        
        StripePaymentIntent intent = stripePaymentIntentMapper.selectByPaymentIntentId(paymentIntentId);
        if (intent == null || !intent.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Payment intent not found: " + paymentIntentId);
        }
        
        StripeAccount account = stripeAccountMapper.selectByTenantId(tenantId);
        if (account == null) {
            throw new RuntimeException("Stripe account not found for tenant: " + tenantId);
        }
        
        try {
            RequestOptions requestOptions = RequestOptions.builder()
                .setStripeAccount(account.getStripeAccountId())
                .build();
            
            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId, requestOptions);
            PaymentIntent canceledIntent = paymentIntent.cancel(requestOptions);
            
            // 更新数据库
            intent.setStatus(canceledIntent.getStatus());
            intent.setCanceledAt(LocalDateTime.now(ZoneOffset.UTC));
            stripePaymentIntentMapper.updateById(intent);
            
            // 更新订单状态
            Order order = orderMapper.selectById(intent.getOrderId());
            if (order != null) {
                order.setPaymentStatus("cancelled");
                order.setOrderStatus("cancelled");
                order.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
                orderMapper.updateById(order);
            }
            
            return convertToPaymentIntentDTO(intent);
            
        } catch (StripeException e) {
            log.error("Failed to cancel payment intent", e);
            throw new RuntimeException("Failed to cancel payment intent: " + e.getMessage());
        }
    }
    
    @Override
    @Transactional
    public LocationDTO createLocation(Long tenantId, CreateLocationRequest request) {
        log.info("Creating location for tenant: {}", tenantId);
        
        StripeAccount account = stripeAccountMapper.selectByTenantId(tenantId);
        if (account == null || !account.getChargesEnabled()) {
            throw new RuntimeException("Stripe account not ready for tenant: " + tenantId);
        }
        
        try {
            // 创建Location
            com.stripe.param.terminal.LocationCreateParams params = com.stripe.param.terminal.LocationCreateParams.builder()
                .setDisplayName(request.getDisplayName())
                .setAddress(com.stripe.param.terminal.LocationCreateParams.Address.builder()
                    .setLine1(request.getAddress().getLine1())
                    .setLine2(request.getAddress().getLine2())
                    .setCity(request.getAddress().getCity())
                    .setState(request.getAddress().getState())
                    .setCountry(request.getAddress().getCountry())
                    .setPostalCode(request.getAddress().getPostalCode())
                    .build())
                .putMetadata("tenant_id", tenantId.toString())
                .build();
            
            RequestOptions requestOptions = RequestOptions.builder()
                .setStripeAccount(account.getStripeAccountId())
                .build();
            
            com.stripe.model.terminal.Location location = com.stripe.model.terminal.Location.create(params, requestOptions);
            
            // 保存到数据库
            StripeLocation stripeLocation = new StripeLocation();
            stripeLocation.setTenantId(tenantId);
            stripeLocation.setStripeAccountId(account.getStripeAccountId());
            stripeLocation.setLocationId(location.getId());
            stripeLocation.setDisplayName(location.getDisplayName());
            stripeLocation.setAddressLine1(location.getAddress().getLine1());
            stripeLocation.setAddressLine2(location.getAddress().getLine2());
            stripeLocation.setAddressCity(location.getAddress().getCity());
            stripeLocation.setAddressState(location.getAddress().getState());
            stripeLocation.setAddressCountry(location.getAddress().getCountry());
            stripeLocation.setAddressPostalCode(location.getAddress().getPostalCode());
            stripeLocation.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
            stripeLocation.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
            stripeLocation.setDeleted(false);
            
            stripeLocationMapper.insert(stripeLocation);
            
            return LocationDTO.builder()
                .id(location.getId())
                .displayName(location.getDisplayName())
                .address(LocationDTO.Address.builder()
                    .line1(location.getAddress().getLine1())
                    .line2(location.getAddress().getLine2())
                    .city(location.getAddress().getCity())
                    .state(location.getAddress().getState())
                    .country(location.getAddress().getCountry())
                    .postalCode(location.getAddress().getPostalCode())
                    .build())
                .build();
        } catch (Exception e) {
            log.error("Failed to create location for tenant: {}", tenantId, e);
            throw new RuntimeException("Failed to create location: " + e.getMessage());
        }
    }
    
    @Override
    public List<LocationDTO> listLocations(Long tenantId) {
        log.info("Listing locations for tenant: {}", tenantId);
        
        // 先尝试从数据库获取
        List<StripeLocation> dbLocations = stripeLocationMapper.selectByTenantId(tenantId);
        if (!dbLocations.isEmpty()) {
            return dbLocations.stream()
                .map(loc -> LocationDTO.builder()
                    .id(loc.getLocationId())
                    .displayName(loc.getDisplayName())
                    .address(LocationDTO.Address.builder()
                        .line1(loc.getAddressLine1())
                        .line2(loc.getAddressLine2())
                        .city(loc.getAddressCity())
                        .state(loc.getAddressState())
                        .country(loc.getAddressCountry())
                        .postalCode(loc.getAddressPostalCode())
                        .build())
                    .build())
                .collect(Collectors.toList());
        }
        
        // 如果数据库没有，从Stripe API获取并同步到数据库
        StripeAccount account = stripeAccountMapper.selectByTenantId(tenantId);
        if (account == null) {
            return new ArrayList<>();
        }
        
        try {
            com.stripe.param.terminal.LocationListParams params = com.stripe.param.terminal.LocationListParams.builder()
                .setLimit(100L)
                .build();
            
            RequestOptions requestOptions = RequestOptions.builder()
                .setStripeAccount(account.getStripeAccountId())
                .build();
            
            com.stripe.model.terminal.LocationCollection locations = 
                com.stripe.model.terminal.Location.list(params, requestOptions);
            
            // 同步到数据库
            for (com.stripe.model.terminal.Location location : locations.getData()) {
                StripeLocation existing = stripeLocationMapper.selectByLocationId(location.getId());
                if (existing == null) {
                    StripeLocation stripeLocation = new StripeLocation();
                    stripeLocation.setTenantId(tenantId);
                    stripeLocation.setStripeAccountId(account.getStripeAccountId());
                    stripeLocation.setLocationId(location.getId());
                    stripeLocation.setDisplayName(location.getDisplayName());
                    stripeLocation.setAddressLine1(location.getAddress().getLine1());
                    stripeLocation.setAddressLine2(location.getAddress().getLine2());
                    stripeLocation.setAddressCity(location.getAddress().getCity());
                    stripeLocation.setAddressState(location.getAddress().getState());
                    stripeLocation.setAddressCountry(location.getAddress().getCountry());
                    stripeLocation.setAddressPostalCode(location.getAddress().getPostalCode());
                    stripeLocation.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
                    stripeLocation.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
                    stripeLocation.setDeleted(false);
                    stripeLocationMapper.insert(stripeLocation);
                }
            }
            
            return locations.getData().stream()
                .map(location -> LocationDTO.builder()
                    .id(location.getId())
                    .displayName(location.getDisplayName())
                    .address(LocationDTO.Address.builder()
                        .line1(location.getAddress().getLine1())
                        .line2(location.getAddress().getLine2())
                        .city(location.getAddress().getCity())
                        .state(location.getAddress().getState())
                        .country(location.getAddress().getCountry())
                        .postalCode(location.getAddress().getPostalCode())
                        .build())
                    .build())
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Failed to list locations for tenant: {}", tenantId, e);
            return new ArrayList<>();
        }
    }
    
    @Override
    @Transactional
    public TerminalDTO createTerminal(Long tenantId, CreateTerminalRequest request) {
        log.info("Creating terminal for tenant: {}", tenantId);
        
        StripeAccount account = stripeAccountMapper.selectByTenantId(tenantId);
        if (account == null) {
            throw new RuntimeException("Stripe account not found for tenant: " + tenantId);
        }
        
        try {
            // 检查并确保账户有card_payments能力
            Account stripeAccount = Account.retrieve(account.getStripeAccountId());
            
            // 检查card_payments能力
            if (stripeAccount.getCapabilities() == null || 
                stripeAccount.getCapabilities().getCardPayments() == null ||
                !"active".equals(stripeAccount.getCapabilities().getCardPayments())) {
                
                log.info("Card payments capability not active for account: {}, requesting capability", account.getStripeAccountId());
                
                // 更新账户请求card_payments能力
                AccountUpdateParams updateParams = AccountUpdateParams.builder()
                    .setCapabilities(AccountUpdateParams.Capabilities.builder()
                        .setCardPayments(AccountUpdateParams.Capabilities.CardPayments.builder()
                            .setRequested(true)
                            .build())
                        .setTransfers(AccountUpdateParams.Capabilities.Transfers.builder()
                            .setRequested(true)
                            .build())
                        .build())
                    .build();
                
                stripeAccount.update(updateParams);
                
                // 重新检查能力状态
                stripeAccount = Account.retrieve(account.getStripeAccountId());
                if (stripeAccount.getCapabilities() == null || 
                    stripeAccount.getCapabilities().getCardPayments() == null ||
                    !"active".equals(stripeAccount.getCapabilities().getCardPayments())) {
                    throw new RuntimeException("Card payments capability is not active. Please complete the onboarding process first.");
                }
            }
            
            // 检查charges_enabled
            if (!stripeAccount.getChargesEnabled()) {
                throw new RuntimeException("Charges are not enabled for this account. Please complete the onboarding process first.");
            }
            
            // 验证locationId是否提供
            String locationId = request.getLocationId();
            if (locationId == null || locationId.trim().isEmpty()) {
                log.error("No location ID provided for terminal creation");
                throw new RuntimeException("Location ID is required to create a terminal");
            }
            
            // 创建Terminal Reader
            ReaderCreateParams params = ReaderCreateParams.builder()
                .setRegistrationCode(request.getRegistrationCode())
                .setLabel(request.getLabel())
                .setLocation(locationId)
                .putMetadata("tenant_id", tenantId.toString())
                .build();
            
            RequestOptions requestOptions = RequestOptions.builder()
                .setStripeAccount(account.getStripeAccountId())
                .build();
            
            Reader reader = Reader.create(params, requestOptions);
            
            // 保存到数据库
            StripeTerminal terminal = new StripeTerminal();
            terminal.setTenantId(tenantId);
            terminal.setStripeAccountId(account.getStripeAccountId());
            terminal.setTerminalId(reader.getId());
            terminal.setLabel(request.getLabel());
            terminal.setDeviceType(reader.getDeviceType());
            terminal.setSerialNumber(reader.getSerialNumber());
            terminal.setLocationId(reader.getLocation());
            terminal.setStatus(reader.getStatus());
            terminal.setConfig(null); // Initialize as null for now
            terminal.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
            terminal.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
            terminal.setDeleted(false);
            
            stripeTerminalMapper.insert(terminal);
            
            return convertToTerminalDTO(terminal);
            
        } catch (StripeException e) {
            log.error("Failed to create terminal", e);
            throw new RuntimeException("Failed to create terminal: " + e.getMessage());
        }
    }
    
    @Override
    public List<TerminalDTO> listTerminals(Long tenantId) {
        List<StripeTerminal> terminals = stripeTerminalMapper.selectByTenantId(tenantId);
        return terminals.stream()
            .map(this::convertToTerminalDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public TerminalDTO updateTerminalStatus(Long tenantId, String terminalId) {
        log.info("Updating terminal status: {} for tenant: {}", terminalId, tenantId);
        
        StripeTerminal terminal = stripeTerminalMapper.selectByTerminalId(terminalId);
        if (terminal == null || !terminal.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Terminal not found: " + terminalId);
        }
        
        StripeAccount account = stripeAccountMapper.selectByTenantId(tenantId);
        if (account == null) {
            throw new RuntimeException("Stripe account not found for tenant: " + tenantId);
        }
        
        try {
            RequestOptions requestOptions = RequestOptions.builder()
                .setStripeAccount(account.getStripeAccountId())
                .build();
            
            Reader reader = Reader.retrieve(terminalId, requestOptions);
            
            // 更新状态
            terminal.setStatus(reader.getStatus());
            if (reader.getIpAddress() != null) {
                terminal.setIpAddress(reader.getIpAddress());
            }
            terminal.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
            stripeTerminalMapper.updateById(terminal);
            
            return convertToTerminalDTO(terminal);
            
        } catch (StripeException e) {
            log.error("Failed to update terminal status", e);
            throw new RuntimeException("Failed to update terminal status: " + e.getMessage());
        }
    }
    
    @Override
    @Transactional
    public boolean deleteTerminal(Long tenantId, String terminalId) {
        log.info("Deleting terminal: {} for tenant: {}", terminalId, tenantId);
        
        // 验证终端属于该租户
        StripeTerminal terminal = stripeTerminalMapper.selectByTerminalId(terminalId);
        if (terminal == null || !terminal.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Terminal not found or unauthorized: " + terminalId);
        }
        
        StripeAccount account = stripeAccountMapper.selectByTenantId(tenantId);
        if (account == null) {
            throw new RuntimeException("Stripe account not found for tenant: " + tenantId);
        }
        
        try {
            // 从Stripe删除终端
            RequestOptions requestOptions = RequestOptions.builder()
                .setStripeAccount(account.getStripeAccountId())
                .build();
            
            Reader reader = Reader.retrieve(terminalId, requestOptions);
            reader.delete(requestOptions);
            
            // 从数据库软删除
            terminal.setDeleted(true);
            terminal.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
            stripeTerminalMapper.updateById(terminal);
            
            log.info("Successfully deleted terminal: {} for tenant: {}", terminalId, tenantId);
            return true;
            
        } catch (StripeException e) {
            log.error("Failed to delete terminal from Stripe", e);
            throw new RuntimeException("Failed to delete terminal: " + e.getMessage());
        }
    }
    
    @Override
    @Transactional
    public boolean deleteLocation(Long tenantId, String locationId) {
        log.info("Deleting location: {} for tenant: {}", locationId, tenantId);
        
        StripeAccount account = stripeAccountMapper.selectByTenantId(tenantId);
        if (account == null) {
            throw new RuntimeException("Stripe account not found for tenant: " + tenantId);
        }
        
        try {
            // 检查是否有终端使用此location
            List<StripeTerminal> terminals = stripeTerminalMapper.selectByTenantId(tenantId);
            boolean hasTerminalsUsingLocation = terminals.stream()
                .anyMatch(t -> locationId.equals(t.getLocationId()) && !t.getDeleted());
            
            if (hasTerminalsUsingLocation) {
                throw new RuntimeException("Cannot delete location: terminals are still using this location");
            }
            
            // 从Stripe删除location
            RequestOptions requestOptions = RequestOptions.builder()
                .setStripeAccount(account.getStripeAccountId())
                .build();
            
            Location location = Location.retrieve(locationId, requestOptions);
            location.delete(requestOptions);
            
            // 从数据库删除（如果有记录的话）
            StripeLocation dbLocation = stripeLocationMapper.selectByLocationId(locationId);
            if (dbLocation != null) {
                dbLocation.setDeleted(true);
                dbLocation.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
                stripeLocationMapper.updateById(dbLocation);
            }
            
            log.info("Successfully deleted location: {} for tenant: {}", locationId, tenantId);
            return true;
            
        } catch (StripeException e) {
            log.error("Failed to delete location from Stripe", e);
            throw new RuntimeException("Failed to delete location: " + e.getMessage());
        }
    }
    
    @Override
    public CollectPaymentResultDTO collectPaymentMethod(Long tenantId, String terminalId, String paymentIntentId) {
        log.info("Collecting payment method on terminal: {} for payment: {}", terminalId, paymentIntentId);
        
        // Terminal API的collect payment method通常通过SDK或Terminal应用处理
        // 这里提供一个简化的实现
        try {
            return CollectPaymentResultDTO.builder()
                .status("pending")
                .message("Payment collection initiated on terminal")
                .build();
        } catch (Exception e) {
            log.error("Failed to collect payment method", e);
            return CollectPaymentResultDTO.builder()
                .status("failed")
                .errorMessage(e.getMessage())
                .build();
        }
    }
    
    @Override
    public ProcessPaymentResultDTO processPayment(Long tenantId, String terminalId, String paymentIntentId) {
        log.info("Processing payment on terminal: {} for payment: {}", terminalId, paymentIntentId);
        
        try {
            // 确认支付
            PaymentIntentDTO result = confirmPaymentIntent(tenantId, paymentIntentId);
            
            return ProcessPaymentResultDTO.builder()
                .status(result.getStatus())
                .paymentIntentId(paymentIntentId)
                .amount(result.getAmount())
                .currency(result.getCurrency())
                .message("Payment processed successfully")
                .processedAt(LocalDateTime.now(ZoneOffset.UTC))
                .build();
                
        } catch (Exception e) {
            log.error("Failed to process payment", e);
            return ProcessPaymentResultDTO.builder()
                .status("failed")
                .paymentIntentId(paymentIntentId)
                .errorMessage(e.getMessage())
                .build();
        }
    }
    
    @Override
    @Transactional
    public RefundDTO createRefund(Long tenantId, CreateRefundRequest request) {
        log.info("Creating refund for payment: {}", request.getPaymentIntentId());
        
        StripePaymentIntent intent = stripePaymentIntentMapper.selectByPaymentIntentId(request.getPaymentIntentId());
        if (intent == null || !intent.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Payment intent not found: " + request.getPaymentIntentId());
        }
        
        StripeAccount account = stripeAccountMapper.selectByTenantId(tenantId);
        if (account == null) {
            throw new RuntimeException("Stripe account not found for tenant: " + tenantId);
        }
        
        try {
            RefundCreateParams.Builder paramsBuilder = RefundCreateParams.builder()
                .setPaymentIntent(request.getPaymentIntentId());
            
            if (request.getAmount() != null) {
                paramsBuilder.setAmount(request.getAmount());
            }
            
            if (request.getReason() != null) {
                paramsBuilder.setReason(RefundCreateParams.Reason.valueOf(request.getReason().toUpperCase()));
            }
            
            RequestOptions requestOptions = RequestOptions.builder()
                .setStripeAccount(account.getStripeAccountId())
                .build();
            
            Refund refund = Refund.create(paramsBuilder.build(), requestOptions);
            
            return RefundDTO.builder()
                .refundId(refund.getId())
                .paymentIntentId(request.getPaymentIntentId())
                .amount(refund.getAmount())
                .currency(refund.getCurrency())
                .status(refund.getStatus())
                .reason(refund.getReason())
                .createdAt(LocalDateTime.now(ZoneOffset.UTC))
                .build();
                
        } catch (StripeException e) {
            log.error("Failed to create refund", e);
            throw new RuntimeException("Failed to create refund: " + e.getMessage());
        }
    }
    
    @Override
    public WebhookResultDTO handleWebhook(String payload, String signature) {
        log.info("Processing Stripe webhook");
        
        try {
            Event event = Webhook.constructEvent(payload, signature, webhookSecret);
            
            // 从event中获取account ID来确定租户
            String accountId = event.getAccount();
            StripeAccount account = null;
            if (accountId != null) {
                account = stripeAccountMapper.selectByStripeAccountId(accountId);
            }
            
            Long tenantId = account != null ? account.getTenantId() : null;
            
            // 处理不同类型的事件
            switch (event.getType()) {
                case "payment_intent.succeeded":
                    handlePaymentIntentSucceeded(event, tenantId);
                    break;
                case "payment_intent.payment_failed":
                    handlePaymentIntentFailed(event, tenantId);
                    break;
                case "account.updated":
                    handleAccountUpdated(event, tenantId);
                    break;
                default:
                    log.info("Unhandled event type: {}", event.getType());
            }
            
            return WebhookResultDTO.builder()
                .eventId(event.getId())
                .eventType(event.getType())
                .status("processed")
                .tenantId(tenantId)
                .message("Event processed successfully")
                .build();
                
        } catch (Exception e) {
            log.error("Failed to process webhook", e);
            return WebhookResultDTO.builder()
                .status("failed")
                .message(e.getMessage())
                .build();
        }
    }
    
    @Override
    public Long calculateApplicationFee(Long amount) {
        // 计算平台费用（按百分比）
        return Math.round(amount * platformFeePercentage / 100);
    }
    
    @Override
    public String getStripeDashboardUrl(Long tenantId) {
        StripeAccount account = stripeAccountMapper.selectByTenantId(tenantId);
        if (account == null) {
            log.warn("No Stripe account found for tenant: {}", tenantId);
            return null;
        }
        
        // 为Express账户生成登录链接
        // 注意：LoginLink是一次性的，每次调用都会生成新的链接
        try {
            // Express Dashboard Login Link
            // 这会创建一个临时的、安全的URL，允许连接账户所有者直接访问他们的Stripe Express仪表板
            // 无需单独登录
            LoginLink loginLink = LoginLink.createOnAccount(
                account.getStripeAccountId(),
                (Map<String, Object>) null,  // Express账户不需要额外参数
                null  // 使用默认的RequestOptions
            );
            
            String url = loginLink.getUrl();
            log.info("Generated Express Dashboard login link for tenant {}: {}", tenantId, url);
            
            // 注意：这个链接是临时的，有效期很短（通常几分钟）
            // 不应该保存这个URL，每次都应该生成新的
            return url;
            
        } catch (StripeException e) {
            log.error("Failed to create Express Dashboard login link for tenant: {}", tenantId, e);
            
            // 如果是Standard或Custom账户，返回标准的Stripe Dashboard URL
            // 用户需要自己登录
            if ("standard".equals(account.getAccountType()) || "custom".equals(account.getAccountType())) {
                log.info("Returning standard dashboard URL for non-Express account");
                return "https://dashboard.stripe.com/login";
            }
            
            return null;
        }
    }
    
    // 辅助方法
    
    private void handlePaymentIntentSucceeded(Event event, Long tenantId) {
        PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer()
            .getObject().orElse(null);
        
        if (paymentIntent != null) {
            StripePaymentIntent intent = stripePaymentIntentMapper.selectByPaymentIntentId(paymentIntent.getId());
            if (intent != null) {
                intent.setStatus("succeeded");
                intent.setConfirmedAt(LocalDateTime.now(ZoneOffset.UTC));
                stripePaymentIntentMapper.updateById(intent);
                
                // 更新订单状态
                Order order = orderMapper.selectById(intent.getOrderId());
                if (order != null) {
                    order.setPaymentStatus("paid");
                    order.setOrderStatus("completed");
                    order.setCompletedAt(LocalDateTime.now(ZoneOffset.UTC));
                    orderMapper.updateById(order);
                }
            }
        }
    }
    
    private void handlePaymentIntentFailed(Event event, Long tenantId) {
        PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer()
            .getObject().orElse(null);
        
        if (paymentIntent != null) {
            StripePaymentIntent intent = stripePaymentIntentMapper.selectByPaymentIntentId(paymentIntent.getId());
            if (intent != null) {
                intent.setStatus("failed");
                stripePaymentIntentMapper.updateById(intent);
                
                // 更新订单状态
                Order order = orderMapper.selectById(intent.getOrderId());
                if (order != null) {
                    order.setPaymentStatus("failed");
                    orderMapper.updateById(order);
                }
            }
        }
    }
    
    private void handleAccountUpdated(Event event, Long tenantId) {
        Account stripeAccount = (Account) event.getDataObjectDeserializer()
            .getObject().orElse(null);
        
        if (stripeAccount != null && tenantId != null) {
            syncAccountStatus(tenantId);
        }
    }
    
    private StripeAccountDTO convertToDTO(StripeAccount account) {
        Map<String, Object> metadata = convertFromJson(account.getMetadata(), Map.class);
        List<String> pendingVerification = null;
        Boolean requiresAction = false;
        
        if (metadata != null) {
            if (metadata.containsKey("pending_verification")) {
                pendingVerification = (List<String>) metadata.get("pending_verification");
            }
            if (metadata.containsKey("requires_action")) {
                requiresAction = (Boolean) metadata.get("requires_action");
            }
        }
        
        // 判断是否为测试模式
        boolean isTestMode = stripeApiKey.startsWith("sk_test");
        
        return StripeAccountDTO.builder()
            .id(account.getId())
            .tenantId(account.getTenantId())
            .stripeAccountId(account.getStripeAccountId())
            .stripeUserId(account.getStripeUserId())
            .accountType(account.getAccountType())
            .onboardingCompleted(account.getOnboardingCompleted())
            .chargesEnabled(account.getChargesEnabled())
            .payoutsEnabled(account.getPayoutsEnabled())
            .detailsSubmitted(account.getDetailsSubmitted())
            .isTestMode(isTestMode)
            .businessName(account.getBusinessName())
            .businessType(account.getBusinessType())
            .country(account.getCountry())
            .defaultCurrency(account.getDefaultCurrency())
            .dashboardUrl(account.getDashboardUrl())
            .onboardingUrl(account.getOnboardingUrl())
            .pendingVerification(pendingVerification)
            .requiresAction(requiresAction)
            .metadata(metadata)
            .createdAt(account.getCreatedAt())
            .updatedAt(account.getUpdatedAt())
            .build();
    }
    
    private PaymentIntentDTO convertToPaymentIntentDTO(StripePaymentIntent intent) {
        return PaymentIntentDTO.builder()
            .paymentIntentId(intent.getPaymentIntentId())
            .clientSecret(intent.getClientSecret())
            .amount(intent.getAmount())
            .currency(intent.getCurrency())
            .status(intent.getStatus())
            .paymentMethodId(intent.getPaymentMethodId())
            .paymentMethodType(intent.getPaymentMethodType())
            .applicationFeeAmount(intent.getApplicationFeeAmount())
            .metadata(convertFromJson(intent.getMetadata(), Map.class))
            .createdAt(intent.getCreatedAt())
            .confirmedAt(intent.getConfirmedAt())
            .canceledAt(intent.getCanceledAt())
            .build();
    }
    
    private TerminalDTO convertToTerminalDTO(StripeTerminal terminal) {
        return TerminalDTO.builder()
            .terminalId(terminal.getTerminalId())
            .label(terminal.getLabel())
            .deviceType(terminal.getDeviceType())
            .serialNumber(terminal.getSerialNumber())
            .locationId(terminal.getLocationId())
            .status(terminal.getStatus())
            .lastSeenAt(terminal.getLastSeenAt())
            .ipAddress(terminal.getIpAddress())
            .config(convertFromJson(terminal.getConfig(), Map.class))
            .createdAt(terminal.getCreatedAt())
            .updatedAt(terminal.getUpdatedAt())
            .build();
    }
    
    /**
     * 转换对象为JSON字符串
     */
    private String convertToJson(Object obj) {
        if (obj == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.error("Failed to convert to JSON", e);
            return null;
        }
    }
    
    /**
     * 从JSON字符串转换为对象
     */
    @SuppressWarnings("unchecked")
    private <T> T convertFromJson(String json, Class<T> clazz) {
        if (json == null || json.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, clazz);
        } catch (Exception e) {
            log.error("Failed to parse JSON", e);
            return null;
        }
    }
    
    @Override
    @Transactional
    public StripeAccountDTO forceCompleteOnboarding(Long tenantId) {
        log.warn("Force completing onboarding for tenant: {} (TEST MODE ONLY)", tenantId);
        
        // 仅在测试模式下允许
        if (!stripeApiKey.startsWith("sk_test")) {
            throw new RuntimeException("Force complete is only available in test mode");
        }
        
        StripeAccount account = stripeAccountMapper.selectByTenantId(tenantId);
        if (account == null) {
            throw new RuntimeException("Stripe account not found for tenant: " + tenantId);
        }
        
        // 强制设置所有状态为已完成
        account.setOnboardingCompleted(true);
        account.setChargesEnabled(true);
        account.setPayoutsEnabled(true);
        account.setDetailsSubmitted(true);
        
        // 生成Dashboard URL
        String dashboardUrl = String.format(
            "https://dashboard.stripe.com/test/connect/accounts/%s",
            account.getStripeAccountId()
        );
        account.setDashboardUrl(dashboardUrl);
        
        account.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        stripeAccountMapper.updateById(account);
        
        log.info("Successfully force completed onboarding for account: {}", account.getStripeAccountId());
        
        return convertToDTO(account);
    }
    
    @Override
    @Transactional
    public StripeAccountDTO simulateAccountVerification(Long tenantId) {
        log.info("Simulating account verification for tenant: {} (TEST MODE)", tenantId);
        
        // 仅在测试模式下允许
        if (!stripeApiKey.startsWith("sk_test")) {
            throw new RuntimeException("Account verification simulation is only available in test mode");
        }
        
        StripeAccount account = stripeAccountMapper.selectByTenantId(tenantId);
        if (account == null) {
            throw new RuntimeException("Stripe account not found for tenant: " + tenantId);
        }
        
        try {
            // 在Stripe测试模式下，可以使用特殊的API调用来模拟审核完成
            // 这里我们通过更新账户的某些字段来触发审核完成
            Map<String, Object> params = new HashMap<>();
            params.put("metadata", Map.of(
                "test_mode_verification", "completed",
                "verified_at", LocalDateTime.now(ZoneOffset.UTC).toString()
            ));
            
            RequestOptions requestOptions = RequestOptions.builder()
                .setApiKey(stripeApiKey)
                .build();
            
            // 更新Stripe账户
            Account stripeAccount = Account.retrieve(account.getStripeAccountId(), requestOptions);
            
            // 在测试模式下，提交商户详情后，可以通过设置特定的测试数据来模拟审核通过
            // 注意：这需要账户已经提交了详细信息
            if (!account.getDetailsSubmitted()) {
                throw new RuntimeException("Please complete the onboarding form first before simulating verification");
            }
            
            // 更新本地数据库状态
            account.setChargesEnabled(true);
            account.setPayoutsEnabled(true);
            account.setOnboardingCompleted(true);
            
            // 生成Dashboard URL
            String dashboardUrl = String.format(
                "https://dashboard.stripe.com/test/connect/accounts/%s",
                account.getStripeAccountId()
            );
            account.setDashboardUrl(dashboardUrl);
            
            account.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
            stripeAccountMapper.updateById(account);
            
            log.info("Successfully simulated account verification for: {}", account.getStripeAccountId());
            
            return convertToDTO(account);
            
        } catch (StripeException e) {
            log.error("Failed to simulate account verification", e);
            throw new RuntimeException("Failed to simulate account verification: " + e.getMessage());
        }
    }
    
    @Override
    public String triggerAccountUpdateWebhook(Long tenantId) {
        log.info("Triggering account.updated webhook for tenant: {} (TEST MODE)", tenantId);
        
        // 仅在测试模式下允许
        if (!stripeApiKey.startsWith("sk_test")) {
            throw new RuntimeException("Webhook trigger is only available in test mode");
        }
        
        StripeAccount account = stripeAccountMapper.selectByTenantId(tenantId);
        if (account == null) {
            throw new RuntimeException("Stripe account not found for tenant: " + tenantId);
        }
        
        try {
            // 获取最新的Stripe账户状态
            Account stripeAccount = Account.retrieve(account.getStripeAccountId());
            
            // 构造一个模拟的webhook事件
            Map<String, Object> eventData = new HashMap<>();
            eventData.put("id", "evt_test_" + System.currentTimeMillis());
            eventData.put("type", "account.updated");
            eventData.put("account", account.getStripeAccountId());
            eventData.put("created", System.currentTimeMillis() / 1000);
            
            Map<String, Object> dataObject = new HashMap<>();
            dataObject.put("id", stripeAccount.getId());
            dataObject.put("charges_enabled", true);  // 模拟审核通过
            dataObject.put("payouts_enabled", true);  // 模拟审核通过
            dataObject.put("details_submitted", true);
            
            eventData.put("data", Map.of("object", dataObject));
            
            // 调用内部的账户更新处理逻辑
            handleAccountUpdated(null, tenantId);
            
            // 同步账户状态
            syncAccountStatus(tenantId);
            
            return "Successfully triggered account.updated webhook simulation for account: " + account.getStripeAccountId();
            
        } catch (StripeException e) {
            log.error("Failed to trigger webhook", e);
            throw new RuntimeException("Failed to trigger webhook: " + e.getMessage());
        }
    }
    
    @Override
    @Transactional
    public Boolean disconnectAccount(Long tenantId) {
        log.info("Processing Stripe account disconnect for tenant: {}", tenantId);
        
        // 测试模式：完全删除
        // 生产模式：只停用，不删除
        boolean isTestMode = stripeApiKey.startsWith("sk_test");
        
        if (!isTestMode) {
            log.info("Production mode: Deactivating account instead of deleting");
            return deactivateAccount(tenantId);
        }
        
        StripeAccount account = stripeAccountMapper.selectByTenantId(tenantId);
        if (account == null) {
            log.info("No Stripe account found for tenant: {}", tenantId);
            return true;
        }
        
        try {
            // 首先删除关联的终端记录（软删除）
            if (account.getStripeAccountId() != null) {
                int deletedTerminals = stripeTerminalMapper.deleteByStripeAccountId(account.getStripeAccountId());
                if (deletedTerminals > 0) {
                    log.info("Soft deleted {} terminals for Stripe account: {}", deletedTerminals, account.getStripeAccountId());
                }
                
                // 删除关联的Location记录（软删除）
                int deletedLocations = stripeLocationMapper.deleteByStripeAccountId(account.getStripeAccountId());
                if (deletedLocations > 0) {
                    log.info("Soft deleted {} locations for Stripe account: {}", deletedLocations, account.getStripeAccountId());
                }
            } else {
                // 如果没有Stripe账户ID，按租户ID删除
                int deletedTerminals = stripeTerminalMapper.deleteByTenantId(tenantId);
                if (deletedTerminals > 0) {
                    log.info("Soft deleted {} terminals for tenant: {}", deletedTerminals, tenantId);
                }
                
                // 删除关联的Location记录（软删除）
                int deletedLocations = stripeLocationMapper.deleteByTenantId(tenantId);
                if (deletedLocations > 0) {
                    log.info("Soft deleted {} locations for tenant: {}", deletedLocations, tenantId);
                }
            }
            
            // 在Stripe中删除账户（测试模式）
            if (account.getStripeAccountId() != null) {
                try {
                    Account stripeAccount = Account.retrieve(account.getStripeAccountId());
                    stripeAccount.delete();
                    log.info("Deleted Stripe account: {}", account.getStripeAccountId());
                } catch (StripeException e) {
                    // 如果Stripe账户已经不存在，继续删除本地记录
                    log.warn("Stripe account may already be deleted: {}", e.getMessage());
                }
            }
            
            // 标记本地账户为已删除，并清空Stripe相关ID
            account.setDeleted(true);
            // 清空已删除的Stripe账户ID和用户ID，避免重新创建时混淆
            // 注意：这里不直接设置为null，因为可能需要保留历史记录
            // 但需要确保重新创建时不会使用旧的ID
            account.setOnboardingCompleted(false);
            account.setChargesEnabled(false);
            account.setPayoutsEnabled(false);
            account.setDetailsSubmitted(false);
            account.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
            stripeAccountMapper.updateById(account);
            
            log.info("Successfully disconnected Stripe account for tenant: {}", tenantId);
            return true;
            
        } catch (Exception e) {
            log.error("Failed to disconnect account", e);
            throw new RuntimeException("Failed to disconnect account: " + e.getMessage());
        }
    }
    
    /**
     * 停用账户（生产环境）
     * 保留账户数据，但禁用功能
     */
    private Boolean deactivateAccount(Long tenantId) {
        log.info("Deactivating Stripe account for tenant: {} (Production mode)", tenantId);
        
        StripeAccount account = stripeAccountMapper.selectByTenantId(tenantId);
        if (account == null) {
            log.info("No Stripe account found for tenant: {}", tenantId);
            return true;
        }
        
        try {
            // 在生产环境中，我们不删除Stripe账户
            // 而是在本地标记为停用状态
            account.setDeleted(false);  // 不删除，只是停用
            account.setOnboardingCompleted(false);  // 重置入驻状态
            account.setChargesEnabled(false);  // 标记为不能收款
            account.setPayoutsEnabled(false);  // 标记为不能提现
            
            // 添加停用记录到metadata
            Map<String, Object> metadata = convertFromJson(account.getMetadata(), Map.class);
            if (metadata == null) {
                metadata = new HashMap<>();
            }
            metadata.put("deactivated", true);
            metadata.put("deactivated_at", LocalDateTime.now(ZoneOffset.UTC).toString());
            metadata.put("deactivation_reason", "merchant_requested");
            account.setMetadata(convertToJson(metadata));
            
            account.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
            stripeAccountMapper.updateById(account);
            
            log.info("Successfully deactivated Stripe account for tenant: {}. Account data preserved for compliance.", tenantId);
            return true;
            
        } catch (Exception e) {
            log.error("Failed to deactivate account", e);
            throw new RuntimeException("Failed to deactivate account: " + e.getMessage());
        }
    }
}