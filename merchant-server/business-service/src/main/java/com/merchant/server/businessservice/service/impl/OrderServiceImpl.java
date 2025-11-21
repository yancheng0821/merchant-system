package com.merchant.server.businessservice.service.impl;


import com.merchant.server.businessservice.dto.*;
import com.merchant.server.businessservice.entity.Order;
import com.merchant.server.businessservice.entity.Customer;
import com.merchant.server.businessservice.entity.Resource;
import com.merchant.server.businessservice.mapper.*;
import com.merchant.server.businessservice.service.OrderService;
import com.merchant.server.businessservice.util.MessageUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;
import com.merchant.server.common.util.TimeZoneUtils;
import com.merchant.server.common.util.CurrencyUtils;
import com.merchant.server.businessservice.client.MerchantServiceClient;

/**
 * 订单服务实现
 */
@Slf4j
@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {
    
    private final OrderMapper orderMapper;
    private final OrderServiceMapper orderServiceMapper;
    private final CustomerMapper customerMapper;
    private final ServiceMapper serviceMapper;
    private final ResourceMapper resourceMapper;
    private final MessageUtil messageUtil;
    private final MerchantServiceClient merchantServiceClient;
    
    @Override
    public org.springframework.data.domain.Page<OrderDTO> getOrders(
            Long tenantId, String searchTerm, String paymentStatus, String paymentMethod,
            String orderStatus, Long customerId, String startDate, String endDate, Pageable pageable) {

        // 计算分页参数
        int offset = pageable.getPageNumber() * pageable.getPageSize();
        int limit = pageable.getPageSize();

        // 获取商户时区
        String merchantTimezone = getMerchantTimezone(tenantId);

        // 将商户本地日期转换为 UTC 时间范围
        LocalDateTime startDateTime = null;
        LocalDateTime endDateTime = null;

        if (startDate != null && !startDate.isEmpty()) {
            LocalDate start = LocalDate.parse(startDate);
            startDateTime = TimeZoneUtils.getMerchantStartOfDayUTC(start, merchantTimezone);
        }

        if (endDate != null && !endDate.isEmpty()) {
            LocalDate end = LocalDate.parse(endDate);
            endDateTime = TimeZoneUtils.getMerchantEndOfDayUTC(end, merchantTimezone);
        }

        // 查询订单列表
        List<Order> orders = orderMapper.selectByConditions(
            tenantId, searchTerm, paymentStatus, paymentMethod, orderStatus, customerId,
            startDate, endDate, startDateTime, endDateTime, offset, limit);

        // 查询总数
        int total = orderMapper.countByConditions(
            tenantId, searchTerm, paymentStatus, paymentMethod, orderStatus, customerId,
            startDate, endDate, startDateTime, endDateTime);
        
        // 转换为DTO
        List<OrderDTO> orderDTOs = orders.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
        
        // 批量加载订单服务明细
        if (!orderDTOs.isEmpty()) {
            List<Long> orderIds = orderDTOs.stream()
                .map(OrderDTO::getId)
                .collect(Collectors.toList());
            
            // 查询所有订单的服务明细
            List<com.merchant.server.businessservice.entity.OrderService> allOrderServices = 
                orderServiceMapper.selectByOrderIds(orderIds);
            
            // 按订单ID分组
            Map<Long, List<com.merchant.server.businessservice.entity.OrderService>> servicesByOrderId = 
                allOrderServices.stream()
                    .collect(Collectors.groupingBy(com.merchant.server.businessservice.entity.OrderService::getOrderId));
            
            // 为每个订单设置服务明细
            orderDTOs.forEach(orderDTO -> {
                List<com.merchant.server.businessservice.entity.OrderService> orderServices = 
                    servicesByOrderId.getOrDefault(orderDTO.getId(), new ArrayList<>());
                orderDTO.setServices(orderServices.stream()
                    .map(this::convertServiceToDTO)
                    .collect(Collectors.toList()));
            });
        }
            
        return new PageImpl<>(orderDTOs, pageable, total);
    }
    
    @Override
    public OrderDTO getOrderById(Long id) {
        Order order = orderMapper.selectById(id);
        if (order == null) {
            return null;
        }
        
        OrderDTO dto = convertToDTO(order);
        
        // 加载订单服务明细
        List<com.merchant.server.businessservice.entity.OrderService> services = orderServiceMapper.selectByOrderId(id);
        dto.setServices(services.stream()
            .map(this::convertServiceToDTO)
            .collect(Collectors.toList()));
            
        return dto;
    }
    
    @Override
    @Transactional
    public OrderDTO createOrder(OrderCreateDTO orderCreate) {
        log.info("Creating order for tenant: {}", orderCreate.getTenantId());
        
        try {
            // 验证客户是否存在
            Customer customer = customerMapper.selectById(orderCreate.getCustomerId());
            if (customer == null) {
                log.error("Customer not found with ID: {}", orderCreate.getCustomerId());
                throw new RuntimeException(messageUtil.getMessage("error.order.customer.not.found", new Object[]{orderCreate.getCustomerId()}));
            }

            
            // 验证资源是否存在（如果提供了资源ID）
            if (orderCreate.getResourceId() != null) {
                Resource resource = resourceMapper.findById(orderCreate.getResourceId());
                if (resource == null) {
                    log.error("Resource not found with ID: {}", orderCreate.getResourceId());
                    throw new RuntimeException(messageUtil.getMessage("error.order.resource.not.found", new Object[]{orderCreate.getResourceId()}));
                }

            }
            
            // 创建订单
            Order order = new Order();
            order.setTenantId(orderCreate.getTenantId());
            order.setOrderNumber(generateOrderNumber());
            order.setCustomerId(orderCreate.getCustomerId());
            order.setAppointmentId(orderCreate.getAppointmentId());
            order.setResourceId(orderCreate.getResourceId());
            order.setResourceType(orderCreate.getResourceType());
            order.setTaxRate(orderCreate.getTaxRate());
            order.setTipPercentage(orderCreate.getTipPercentage());
            order.setTipPaymentMethod(orderCreate.getTipPaymentMethod());
            order.setNotes(orderCreate.getNotes());
            order.setOrderStatus("draft");
            order.setPaymentStatus("pending");
            order.setPaymentMethod(orderCreate.getPaymentMethod());
            order.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
            order.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
            // Set created_by and updated_by to resource_id if available, otherwise null
            order.setCreatedBy(orderCreate.getResourceId());
            order.setUpdatedBy(orderCreate.getResourceId());



            // Use amounts from frontend (already calculated excluding package payments)
            // If frontend provides subtotal and totalAmount, use them directly
            if (orderCreate.getSubtotal() != null && orderCreate.getTotalAmount() != null) {
                log.info("Using amounts from frontend - Subtotal: {}, TotalAmount: {}",
                    orderCreate.getSubtotal(), orderCreate.getTotalAmount());

                order.setSubtotal(orderCreate.getSubtotal());
                // Tax amount and tip amount are already provided by frontend
                order.setTaxAmount(orderCreate.getTaxRate() != null ? orderCreate.getSubtotal() * orderCreate.getTaxRate() : 0.0);
                order.setTipAmount(orderCreate.getTipAmount() != null ? orderCreate.getTipAmount() : 0.0);
                order.setTotalAmount(orderCreate.getTotalAmount());

                log.info("Order amounts set from frontend - Subtotal: {}, Tax: {}, Tip: {}, Total: {}",
                    order.getSubtotal(), order.getTaxAmount(), order.getTipAmount(), order.getTotalAmount());
            } else {
                // Fallback: Calculate amounts from service prices (backward compatibility)
                log.info("Frontend did not provide amounts, calculating from service prices");
                double subtotal = 0.0;
                for (OrderServiceCreateDTO serviceCreate : orderCreate.getServices()) {
                    com.merchant.server.businessservice.entity.Service service = serviceMapper.selectById(serviceCreate.getServiceId());
                    if (service == null) {
                        log.error("Service not found with ID: {}", serviceCreate.getServiceId());
                        throw new RuntimeException(messageUtil.getMessage("error.order.service.not.found", new Object[]{serviceCreate.getServiceId()}));
                    }
                    subtotal += service.getPrice().doubleValue() * serviceCreate.getQuantity();
                }

                order.setSubtotal(subtotal);
                order.setTaxAmount(subtotal * orderCreate.getTaxRate());

                // 如果前端传了tipAmount（custom输入），直接使用；否则根据tipPercentage计算
                if (orderCreate.getTipAmount() != null && orderCreate.getTipAmount() > 0) {
                    order.setTipAmount(orderCreate.getTipAmount());
                } else {
                    order.setTipAmount(subtotal * orderCreate.getTipPercentage() / 100);
                }

                order.setTotalAmount(subtotal + order.getTaxAmount() + order.getTipAmount());

                log.info("Order amounts calculated - Subtotal: {}, Tax: {}, Tip: {}, Total: {}",
                    order.getSubtotal(), order.getTaxAmount(), order.getTipAmount(), order.getTotalAmount());
            }
            
            // 插入订单
            log.info("Inserting order into database...");
            orderMapper.insert(order);
            log.info("Order inserted with ID: {}", order.getId());
            
            // 创建订单服务明细
            for (OrderServiceCreateDTO serviceCreate : orderCreate.getServices()) {
                log.info("Creating order service for service ID: {}", serviceCreate.getServiceId());
                com.merchant.server.businessservice.entity.Service service = serviceMapper.selectById(serviceCreate.getServiceId());
                if (service != null) {
                    com.merchant.server.businessservice.entity.OrderService orderService = new com.merchant.server.businessservice.entity.OrderService();
                    orderService.setOrderId(order.getId());
                    orderService.setServiceId(service.getId());
                    orderService.setServiceName(service.getName());
                    orderService.setServiceCategory(service.getCategory() != null ? service.getCategory().getName() : null);
                    orderService.setPrice(service.getPrice().doubleValue());
                    orderService.setQuantity(serviceCreate.getQuantity());
                    orderService.setDuration(service.getDuration());
                    orderService.setAssignedResourceId(serviceCreate.getAssignedResourceId());
                    orderService.setAssignedResourceType(serviceCreate.getAssignedResourceType());
                    orderService.setPaymentMethod(serviceCreate.getPaymentMethod()); // Copy payment method from DTO
                    orderService.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
                    orderService.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));

                    log.info("OrderService object: {}", orderService);
                    orderServiceMapper.insert(orderService);
                    log.info("Order service inserted with ID: {}", orderService.getId());
                }
            }

            // 设置 Order 表的支付金额字段（用于统计）
            // 无论是否补充支付，都填充对应的金额字段，方便后续统计
            java.math.BigDecimal totalAmountBD = java.math.BigDecimal.valueOf(order.getTotalAmount());

            // 单服务场景的简单支付处理（纯礼品卡、纯现金等）
            // 多服务场景会在后面的多服务混合支付逻辑中处理
            boolean isSingleService = orderCreate.getServices() == null || orderCreate.getServices().size() <= 1;

            if (isSingleService && "gift_card".equalsIgnoreCase(orderCreate.getPaymentMethod())) {
                java.math.BigDecimal giftCardAmount = orderCreate.getGiftCardAmount() != null ?
                        java.math.BigDecimal.valueOf(orderCreate.getGiftCardAmount()) : java.math.BigDecimal.ZERO;
                String additionalPaymentMethod = orderCreate.getAdditionalPaymentMethod();

                // 检查是否需要补充支付
                // 如果有additionalPaymentMethod且additionalPaymentAmount > 0，说明需要补充支付
                boolean hasSupplementaryPayment = additionalPaymentMethod != null
                        && !additionalPaymentMethod.isEmpty()
                        && orderCreate.getAdditionalPaymentAmount() != null
                        && orderCreate.getAdditionalPaymentAmount() > 0;

                if (hasSupplementaryPayment) {
                    // 需要补充支付（单服务场景不是混合支付）
                    log.info("Single-service: Gift card with supplementary payment - GiftCard: {}, Additional: {} via {}",
                            giftCardAmount, orderCreate.getAdditionalPaymentAmount(), additionalPaymentMethod);

                    order.setIsMixedPayment(false); // 单服务补充支付，不算混合支付

                    // 直接使用前端传递的金额（前端已经计算好，包含了tip的分配逻辑）
                    java.math.BigDecimal additionalAmount = java.math.BigDecimal.valueOf(orderCreate.getAdditionalPaymentAmount());
                    log.info("Using frontend amounts - GiftCard: {}, Additional: {} via {}",
                            giftCardAmount, additionalAmount, additionalPaymentMethod);

                    // 直接设置礼品卡金额（前端已经根据tip_payment_method计算好了）
                    order.setGiftCardAmount(giftCardAmount);

                    // 根据补充支付方式设置对应的金额字段（前端已经计算好，包含tip如果适用）
                    if ("cash".equalsIgnoreCase(additionalPaymentMethod)) {
                        order.setCashAmount(additionalAmount);
                    } else if ("credit_card".equalsIgnoreCase(additionalPaymentMethod)) {
                        order.setCreditCardAmount(additionalAmount);
                    } else if ("debit_card".equalsIgnoreCase(additionalPaymentMethod)) {
                        order.setDebitCardAmount(additionalAmount);
                    }

                    orderMapper.updateById(order);
                    log.info("Gift card supplementary payment set - GiftCard: {}, {} Amount: {}, Tip: {} via {}",
                            order.getGiftCardAmount(), additionalPaymentMethod, additionalAmount,
                            order.getTipAmount(), orderCreate.getTipPaymentMethod());
                } else {
                    // 礼品卡足够，纯礼品卡支付
                    order.setGiftCardAmount(totalAmountBD);
                    orderMapper.updateById(order);
                    log.info("Single-service: Pure gift card payment - Amount: {}", order.getTotalAmount());
                }
            } else if (isSingleService && "cash".equalsIgnoreCase(orderCreate.getPaymentMethod())) {
                // 纯现金支付
                order.setCashAmount(totalAmountBD);
                orderMapper.updateById(order);
                log.info("Single-service: Pure cash payment - Amount: {}", order.getTotalAmount());
            } else if (isSingleService && "credit_card".equalsIgnoreCase(orderCreate.getPaymentMethod())) {
                // 纯信用卡支付
                order.setCreditCardAmount(totalAmountBD);
                orderMapper.updateById(order);
                log.info("Single-service: Pure credit card payment - Amount: {}", order.getTotalAmount());
            } else if (isSingleService && "debit_card".equalsIgnoreCase(orderCreate.getPaymentMethod())) {
                // 纯借记卡支付
                order.setDebitCardAmount(totalAmountBD);
                orderMapper.updateById(order);
                log.info("Single-service: Pure debit card payment - Amount: {}", order.getTotalAmount());
            } else if (isSingleService && "package".equalsIgnoreCase(orderCreate.getPaymentMethod())) {
                // 套餐支付：服务本身不收费（已在购买套餐时付费），只有小费产生收入
                order.setPackageAmount(java.math.BigDecimal.ZERO); // 套餐本身不产生收入

                // 如果有小费，根据小费支付方式记录到对应字段
                if (order.getTipAmount() != null && order.getTipAmount() > 0) {
                    java.math.BigDecimal tipAmountBD = java.math.BigDecimal.valueOf(order.getTipAmount());
                    String tipMethod = orderCreate.getTipPaymentMethod();

                    if ("cash".equalsIgnoreCase(tipMethod)) {
                        order.setCashAmount(tipAmountBD);
                    } else if ("credit_card".equalsIgnoreCase(tipMethod)) {
                        order.setCreditCardAmount(tipAmountBD);
                    } else if ("debit_card".equalsIgnoreCase(tipMethod)) {
                        order.setDebitCardAmount(tipAmountBD);
                    } else if ("gift_card".equalsIgnoreCase(tipMethod)) {
                        order.setGiftCardAmount(tipAmountBD);
                    }

                    log.info("Package payment - Service: 0, Tip: {} via {}", order.getTipAmount(), tipMethod);
                } else {
                    log.info("Package payment - No tip");
                }

                orderMapper.updateById(order);
            }

            // 根据前端传递的 paymentMode 决定支付逻辑
            // paymentMode: single(单服务), unified(多服务统一), mixed(多服务混合)
            String paymentMode = orderCreate.getPaymentMode();
            log.info("Payment mode: {}", paymentMode);

            if ("mixed".equalsIgnoreCase(paymentMode)) {
                // 多服务混合支付：每个服务可能使用不同的支付方式
                // 直接使用前端传递的金额，不需要重新计算
                log.info("Processing multi-service MIXED payment - service count: {}",
                        orderCreate.getServices().size());

                // 统计各支付方式的总金额
                java.math.BigDecimal giftCardTotal = java.math.BigDecimal.ZERO;
                java.math.BigDecimal cashTotal = java.math.BigDecimal.ZERO;
                java.math.BigDecimal creditCardTotal = java.math.BigDecimal.ZERO;
                java.math.BigDecimal debitCardTotal = java.math.BigDecimal.ZERO;

                // 遍历所有服务，直接累加前端传递的金额
                for (OrderServiceCreateDTO serviceCreate : orderCreate.getServices()) {
                    String servicePaymentMethod = serviceCreate.getPaymentMethod();

                    log.info("Processing service ID: {} - PaymentMethod: {}, ServiceAmount: {}, GiftCardAmount: {}, AdditionalMethod: {}, AdditionalAmount: {}",
                            serviceCreate.getServiceId(), servicePaymentMethod,
                            serviceCreate.getServiceAmount(),
                            serviceCreate.getGiftCardAmount(),
                            serviceCreate.getAdditionalPaymentMethod(),
                            serviceCreate.getAdditionalPaymentAmount());

                    // 套餐支付，跳过
                    if ("package".equalsIgnoreCase(servicePaymentMethod)) {
                        log.info("Package service ID: {} - no revenue", serviceCreate.getServiceId());
                        continue;
                    }

                    // 礼品卡支付：直接累加礼品卡金额和补充支付金额
                    if ("gift_card".equalsIgnoreCase(servicePaymentMethod)) {
                        // 累加礼品卡金额
                        if (serviceCreate.getGiftCardAmount() != null && serviceCreate.getGiftCardAmount() > 0) {
                            giftCardTotal = giftCardTotal.add(
                                java.math.BigDecimal.valueOf(serviceCreate.getGiftCardAmount())
                            );
                        }

                        // 累加补充支付金额
                        if (serviceCreate.getAdditionalPaymentMethod() != null
                                && !serviceCreate.getAdditionalPaymentMethod().isEmpty()
                                && serviceCreate.getAdditionalPaymentAmount() != null
                                && serviceCreate.getAdditionalPaymentAmount() > 0) {
                            java.math.BigDecimal additionalAmount = java.math.BigDecimal.valueOf(
                                serviceCreate.getAdditionalPaymentAmount()
                            );
                            String method = serviceCreate.getAdditionalPaymentMethod().toLowerCase();

                            if ("cash".equals(method)) {
                                cashTotal = cashTotal.add(additionalAmount);
                            } else if ("credit_card".equals(method)) {
                                creditCardTotal = creditCardTotal.add(additionalAmount);
                            } else if ("debit_card".equals(method)) {
                                debitCardTotal = debitCardTotal.add(additionalAmount);
                            }

                            log.info("Service ID: {} - Additional payment: {} = {}",
                                    serviceCreate.getServiceId(), method, additionalAmount);
                        }
                    } else {
                        // 其他支付方式（现金、信用卡、借记卡）
                        // 直接使用前端传递的服务金额（已包含税费分摊）
                        if (serviceCreate.getServiceAmount() != null && serviceCreate.getServiceAmount() > 0) {
                            java.math.BigDecimal serviceActualAmount = java.math.BigDecimal.valueOf(
                                serviceCreate.getServiceAmount()
                            );

                            String method = servicePaymentMethod.toLowerCase();
                            if ("cash".equals(method)) {
                                cashTotal = cashTotal.add(serviceActualAmount);
                            } else if ("credit_card".equals(method)) {
                                creditCardTotal = creditCardTotal.add(serviceActualAmount);
                            } else if ("debit_card".equals(method)) {
                                debitCardTotal = debitCardTotal.add(serviceActualAmount);
                            }

                            log.info("Service ID: {} - Payment: {} = {} (from frontend)",
                                    serviceCreate.getServiceId(), method, serviceActualAmount);
                        }
                    }
                }

                // 处理小费：如果小费支付方式与某个补充支付方式一致，将小费金额加到该支付方式中
                if (orderCreate.getTipAmount() != null && orderCreate.getTipAmount() > 0
                        && orderCreate.getTipPaymentMethod() != null) {
                    java.math.BigDecimal tipAmountBD = java.math.BigDecimal.valueOf(orderCreate.getTipAmount());
                    String tipMethod = orderCreate.getTipPaymentMethod().toLowerCase();

                    log.info("Adding tip amount {} to payment method: {}", tipAmountBD, tipMethod);

                    if ("cash".equals(tipMethod)) {
                        cashTotal = cashTotal.add(tipAmountBD);
                    } else if ("credit_card".equals(tipMethod)) {
                        creditCardTotal = creditCardTotal.add(tipAmountBD);
                    } else if ("debit_card".equals(tipMethod)) {
                        debitCardTotal = debitCardTotal.add(tipAmountBD);
                    } else if ("gift_card".equals(tipMethod)) {
                        giftCardTotal = giftCardTotal.add(tipAmountBD);
                    }
                }

                // 设置各支付方式的金额
                if (giftCardTotal.compareTo(java.math.BigDecimal.ZERO) > 0) {
                    order.setGiftCardAmount(giftCardTotal);
                }
                if (cashTotal.compareTo(java.math.BigDecimal.ZERO) > 0) {
                    order.setCashAmount(cashTotal);
                }
                if (creditCardTotal.compareTo(java.math.BigDecimal.ZERO) > 0) {
                    order.setCreditCardAmount(creditCardTotal);
                }
                if (debitCardTotal.compareTo(java.math.BigDecimal.ZERO) > 0) {
                    order.setDebitCardAmount(debitCardTotal);
                }
                // 套餐支付始终为0（不产生收入）
                order.setPackageAmount(java.math.BigDecimal.ZERO);

                // 设置混合支付标识和支付方式
                order.setIsMixedPayment(true);
                order.setPaymentMethod("MIXED");

                orderMapper.updateById(order);

                log.info("Multi-service MIXED payment amounts set - PaymentMethod: MIXED, GiftCard: {}, Cash: {}, CreditCard: {}, DebitCard: {}, IsMixed: true",
                        giftCardTotal, cashTotal, creditCardTotal, debitCardTotal);
            } else if ("unified".equalsIgnoreCase(paymentMode)) {
                    // 多服务统一支付：所有服务使用相同的主支付方式（可能有补充支付）
                    // 统一支付就是一个整体，直接使用前端传入的总金额，不需要按服务逐个计算
                    log.info("Multi-service UNIFIED payment - payment mode: unified");

                    // 获取统一支付方式（从第一个非套餐服务获取）
                    String unifiedPaymentMethod = null;
                    for (OrderServiceCreateDTO serviceCreate : orderCreate.getServices()) {
                        String servicePaymentMethod = serviceCreate.getPaymentMethod();
                        if (servicePaymentMethod != null && !"package".equalsIgnoreCase(servicePaymentMethod)) {
                            unifiedPaymentMethod = servicePaymentMethod.toLowerCase();
                            break;
                        }
                    }

                    log.info("Unified payment method: {}, Total amount: {}", unifiedPaymentMethod, order.getTotalAmount());

                    // 直接使用前端传入的总金额设置对应的支付方式字段
                    if ("gift_card".equalsIgnoreCase(unifiedPaymentMethod)) {
                        // 礼品卡支付（可能有补充支付）
                        if (orderCreate.getGiftCardAmount() != null && orderCreate.getGiftCardAmount() > 0) {
                            java.math.BigDecimal giftCardAmount = java.math.BigDecimal.valueOf(orderCreate.getGiftCardAmount());
                            order.setGiftCardAmount(giftCardAmount);
                            log.info("Gift card amount set: {}", giftCardAmount);

                            // 如果有补充支付
                            String additionalMethod = orderCreate.getAdditionalPaymentMethod();
                            if (additionalMethod != null && !additionalMethod.isEmpty()
                                    && orderCreate.getAdditionalPaymentAmount() != null
                                    && orderCreate.getAdditionalPaymentAmount() > 0) {
                                java.math.BigDecimal additionalAmount = java.math.BigDecimal.valueOf(orderCreate.getAdditionalPaymentAmount());

                                if ("cash".equalsIgnoreCase(additionalMethod)) {
                                    order.setCashAmount(additionalAmount);
                                } else if ("credit_card".equalsIgnoreCase(additionalMethod)) {
                                    order.setCreditCardAmount(additionalAmount);
                                } else if ("debit_card".equalsIgnoreCase(additionalMethod)) {
                                    order.setDebitCardAmount(additionalAmount);
                                }

                                log.info("Additional payment set: {} = {}", additionalMethod, additionalAmount);
                            }
                        } else {
                            // 纯礼品卡支付，礼品卡金额 = 总金额
                            order.setGiftCardAmount(java.math.BigDecimal.valueOf(order.getTotalAmount()));
                        }
                    } else if ("cash".equalsIgnoreCase(unifiedPaymentMethod)) {
                        // 纯现金支付
                        order.setCashAmount(java.math.BigDecimal.valueOf(order.getTotalAmount()));
                        log.info("Cash payment set: {}", order.getTotalAmount());
                    } else if ("credit_card".equalsIgnoreCase(unifiedPaymentMethod)) {
                        // 纯信用卡支付
                        order.setCreditCardAmount(java.math.BigDecimal.valueOf(order.getTotalAmount()));
                        log.info("Credit card payment set: {}", order.getTotalAmount());
                    } else if ("debit_card".equalsIgnoreCase(unifiedPaymentMethod)) {
                        // 纯借记卡支付
                        order.setDebitCardAmount(java.math.BigDecimal.valueOf(order.getTotalAmount()));
                        log.info("Debit card payment set: {}", order.getTotalAmount());
                    } else if ("package".equalsIgnoreCase(unifiedPaymentMethod)) {
                        // 套餐支付（理论上不会走到这里，因为前面已经跳过了套餐服务）
                        order.setPackageAmount(java.math.BigDecimal.ZERO);

                        // 如果有小费，根据小费支付方式设置
                        if (order.getTipAmount() != null && order.getTipAmount() > 0) {
                            java.math.BigDecimal tipAmountBD = java.math.BigDecimal.valueOf(order.getTipAmount());
                            String tipMethod = orderCreate.getTipPaymentMethod();

                            if ("cash".equalsIgnoreCase(tipMethod)) {
                                order.setCashAmount(tipAmountBD);
                            } else if ("credit_card".equalsIgnoreCase(tipMethod)) {
                                order.setCreditCardAmount(tipAmountBD);
                            } else if ("debit_card".equalsIgnoreCase(tipMethod)) {
                                order.setDebitCardAmount(tipAmountBD);
                            } else if ("gift_card".equalsIgnoreCase(tipMethod)) {
                                order.setGiftCardAmount(tipAmountBD);
                            }

                            log.info("Package payment - Tip: {} via {}", order.getTipAmount(), tipMethod);
                        }
                    }

                    // 统一支付模式，不算混合支付
                    order.setIsMixedPayment(false);

                    orderMapper.updateById(order);

                    log.info("Multi-service UNIFIED payment amounts set - GiftCard: {}, Cash: {}, CreditCard: {}, DebitCard: {}, IsMixed: false",
                            order.getGiftCardAmount(), order.getCashAmount(), order.getCreditCardAmount(), order.getDebitCardAmount());
            }

            log.info("Order creation completed successfully");
            return getOrderById(order.getId());
            
        } catch (Exception e) {
            log.error("Error during order creation", e);
            throw e;
        }
    }
    
    @Override
    @Transactional
    public OrderDTO updateOrder(Long id, OrderDTO orderUpdate) {
        Order order = orderMapper.selectById(id);
        if (order == null) {
            return null;
        }
        
        // 只允许更新部分字段
        if (orderUpdate.getTipAmount() != null) {
            order.setTipAmount(orderUpdate.getTipAmount());
        }
        if (orderUpdate.getNotes() != null) {
            order.setNotes(orderUpdate.getNotes());
        }
        
        // 重新计算总金额
        order.setTotalAmount(CurrencyUtils.calculateTotal(order.getSubtotal(), order.getTaxAmount(), order.getTipAmount()));
        order.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        
        orderMapper.updateById(order);
        
        return getOrderById(id);
    }
    
    @Override
    @Transactional
    public boolean cancelOrder(Long id) {
        Order order = orderMapper.selectById(id);
        if (order == null) {
            return false;
        }

        // 只能取消未支付的订单
        if (!"pending".equals(order.getPaymentStatus())) {
            return false;
        }

        order.setOrderStatus("cancelled");
        order.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        orderMapper.updateById(order);

        return true;
    }

    @Override
    @Transactional
    public OrderDTO updatePaymentMethod(Long id, UpdatePaymentMethodRequest request) {
        // 查找订单
        Order order = orderMapper.selectById(id);
        if (order == null) {
            throw new IllegalStateException("Order not found");
        }

        // 验证业务规则
        // 1. 只能修改已完成且已支付的订单
        if (!"completed".equals(order.getOrderStatus())) {
            throw new IllegalStateException("Only completed orders can have payment method updated");
        }
        if (!"paid".equals(order.getPaymentStatus())) {
            throw new IllegalStateException("Only paid orders can have payment method updated");
        }

        // 2. 不能修改已退款的订单
        if (order.getRefundAmount() != null && order.getRefundAmount() > 0) {
            throw new IllegalStateException("Cannot update payment method for refunded orders");
        }

        // 3. 新支付方式不能与当前相同
        if (request.getNewPaymentMethod().equals(order.getPaymentMethod())) {
            throw new IllegalStateException("New payment method must be different from current payment method");
        }

        // 更新支付方式和备注
        String oldPaymentMethod = order.getPaymentMethod();
        order.setPaymentMethod(request.getNewPaymentMethod());

        // 将修改原因添加到订单备注中
        String updatedNotes = (order.getNotes() != null ? order.getNotes() + "\n" : "") +
                              "[Payment Method Update] " +
                              "Changed from " + oldPaymentMethod + " to " + request.getNewPaymentMethod() +
                              ". Reason: " + request.getReason();
        order.setNotes(updatedNotes);

        order.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        orderMapper.updateById(order);

        // 返回更新后的订单DTO
        return getOrderById(id);
    }

    @Override
    @Transactional
    public OrderDTO updateTipPaymentMethod(Long id, UpdatePaymentMethodRequest request) {
        // 查找订单
        Order order = orderMapper.selectById(id);
        if (order == null) {
            throw new IllegalStateException("Order not found");
        }

        // 验证业务规则
        // 1. 只能修改已完成且已支付的订单
        if (!"completed".equals(order.getOrderStatus())) {
            throw new IllegalStateException("Only completed orders can have tip payment method updated");
        }
        if (!"paid".equals(order.getPaymentStatus())) {
            throw new IllegalStateException("Only paid orders can have tip payment method updated");
        }

        // 2. 不能修改已退款的订单
        if (order.getRefundAmount() != null && order.getRefundAmount() > 0) {
            throw new IllegalStateException("Cannot update tip payment method for refunded orders");
        }

        // 3. 新支付方式不能与当前相同
        if (request.getNewPaymentMethod().equals(order.getTipPaymentMethod())) {
            throw new IllegalStateException("New tip payment method must be different from current tip payment method");
        }

        // 更新小费支付方式和备注
        String oldTipPaymentMethod = order.getTipPaymentMethod();
        order.setTipPaymentMethod(request.getNewPaymentMethod());

        // 将修改原因添加到订单备注中
        String updatedNotes = (order.getNotes() != null ? order.getNotes() + "\n" : "") +
                              "[Tip Payment Method Update] " +
                              "Changed from " + oldTipPaymentMethod + " to " + request.getNewPaymentMethod() +
                              ". Reason: " + request.getReason();
        order.setNotes(updatedNotes);

        order.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        orderMapper.updateById(order);

        // 返回更新后的订单DTO
        return getOrderById(id);
    }

    @Override
    public Map<String, Object> getOrderStats(Long tenantId) {
        Map<String, Object> stats = new HashMap<>();

        try {
            // 获取商户时区
            String merchantTimezone = getMerchantTimezone(tenantId);

            // 获取商户的当前日期
            LocalDate merchantToday = TimeZoneUtils.getMerchantToday(merchantTimezone);

            // 计算商户今日的开始和结束时间（UTC）
            LocalDateTime todayStartUTC = TimeZoneUtils.getMerchantStartOfDayUTC(merchantToday, merchantTimezone);
            LocalDateTime todayEndUTC = TimeZoneUtils.getMerchantEndOfDayUTC(merchantToday, merchantTimezone);

            // 查询今日订单（使用商户时区转换后的UTC时间范围）
            List<Order> todayOrders = orderMapper.selectOrdersEntityByDateTimeRange(tenantId, todayStartUTC, todayEndUTC);

            // 计算今日统计数据
            stats.put("todayOrders", todayOrders.size());
            stats.put("todayRevenue", todayOrders.stream()
                .filter(o -> "paid".equals(o.getPaymentStatus()))
                .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0.0)
                .sum());

            // 计算商户本月的开始和结束日期
            LocalDate monthStart = merchantToday.withDayOfMonth(1);
            LocalDate monthEnd = merchantToday.withDayOfMonth(merchantToday.lengthOfMonth());

            // 转换为UTC时间范围
            LocalDateTime monthStartUTC = TimeZoneUtils.getMerchantStartOfDayUTC(monthStart, merchantTimezone);
            LocalDateTime monthEndUTC = TimeZoneUtils.getMerchantEndOfDayUTC(monthEnd, merchantTimezone);

            // 查询本月订单（使用商户时区转换后的UTC时间范围）
            List<Order> monthOrders = orderMapper.selectOrdersEntityByDateTimeRange(tenantId, monthStartUTC, monthEndUTC);
            stats.put("monthlyRevenue", monthOrders.stream()
                .filter(o -> "paid".equals(o.getPaymentStatus()))
                .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0.0)
                .sum());

            // 待处理订单（不需要时区转换）
            List<Order> pendingOrders = orderMapper.selectPendingOrders(tenantId);
            stats.put("pendingOrders", pendingOrders.size());

            log.info("Order stats calculated for tenant {} using timezone {}: todayOrders={}, todayRevenue={}, monthlyRevenue={}, pendingOrders={}",
                tenantId, merchantTimezone, stats.get("todayOrders"), stats.get("todayRevenue"),
                stats.get("monthlyRevenue"), stats.get("pendingOrders"));

        } catch (Exception e) {
            log.error("Error fetching order stats for tenant: {}", tenantId, e);
            // 返回默认值
            stats.put("todayOrders", 0);
            stats.put("todayRevenue", 0.0);
            stats.put("monthlyRevenue", 0.0);
            stats.put("pendingOrders", 0);
        }

        return stats;
    }
    
    @Override
    public List<OrderDTO> getTodayOrders(Long tenantId) {
        // 简化实现，返回空列表
        return new ArrayList<>();
    }
    
    /**
     * 转换Order为OrderDTO
     */
    private OrderDTO convertToDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setTenantId(order.getTenantId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setCustomerId(order.getCustomerId());
        dto.setAppointmentId(order.getAppointmentId());
        dto.setResourceId(order.getResourceId());
        dto.setResourceType(order.getResourceType());
        dto.setSubtotal(order.getSubtotal());
        dto.setTaxRate(order.getTaxRate());
        dto.setTaxAmount(order.getTaxAmount());
        dto.setTipAmount(order.getTipAmount());
        dto.setTipPercentage(order.getTipPercentage());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setTipPaymentMethod(order.getTipPaymentMethod());
        dto.setPaymentStatus(order.getPaymentStatus());
        dto.setOrderStatus(order.getOrderStatus());
        dto.setPosTerminalId(order.getPosTerminalId());
        dto.setTransactionId(order.getTransactionId());
        dto.setCardLast4(order.getCardLast4());
        dto.setAuthorizationCode(order.getAuthorizationCode());
        dto.setNotes(order.getNotes());
        dto.setRefundAmount(order.getRefundAmount());
        dto.setRefundReason(order.getRefundReason());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());
        dto.setCompletedAt(order.getCompletedAt());
        
        // 加载客户信息
        if (order.getCustomerId() != null) {
            Customer customer = customerMapper.selectById(order.getCustomerId());
            if (customer != null) {
                dto.setCustomerName(customer.getFirstName() + " " + customer.getLastName());
                dto.setCustomerPhone(customer.getPhone());
                // 加载会员等级信息
                dto.setCustomerMembershipTier(customer.getMembershipTier());
            }
        }
        
        // 加载资源信息
        if (order.getResourceId() != null) {
            Resource resource = resourceMapper.findById(order.getResourceId());
            if (resource != null) {
                dto.setResourceName(resource.getName());
            }
        }
        
        // 设置显示值
        dto.setStatusDisplay(getOrderStatusDisplay(order.getOrderStatus()));
        dto.setPaymentMethodDisplay(getPaymentMethodDisplay(order.getPaymentMethod()));
        
        return dto;
    }
    
    /**
     * 转换OrderService为OrderServiceDTO
     */
    private OrderServiceDTO convertServiceToDTO(com.merchant.server.businessservice.entity.OrderService orderService) {
        OrderServiceDTO dto = new OrderServiceDTO();
        dto.setId(orderService.getId());
        dto.setOrderId(orderService.getOrderId());
        dto.setServiceId(orderService.getServiceId());
        dto.setServiceName(orderService.getServiceName());
        dto.setServiceCategory(orderService.getServiceCategory());
        dto.setPrice(orderService.getPrice());
        dto.setQuantity(orderService.getQuantity());
        dto.setDuration(orderService.getDuration());
        dto.setAssignedResourceId(orderService.getAssignedResourceId());
        dto.setAssignedResourceType(orderService.getAssignedResourceType());
        dto.setPaymentMethod(orderService.getPaymentMethod()); // Copy payment method
        dto.setTotalPrice(orderService.getPrice() * orderService.getQuantity());

        // 加载资源名称
        if (orderService.getAssignedResourceId() != null) {
            Resource resource = resourceMapper.findById(orderService.getAssignedResourceId());
            if (resource != null) {
                dto.setAssignedResourceName(resource.getName());
            }
        }

        return dto;
    }
    
    /**
     * 生成订单号
     */
    private String generateOrderNumber() {
        return "ORD-" + System.currentTimeMillis() + "-" + 
            String.format("%04d", new Random().nextInt(10000));
    }
    
    /**
     * 驼峰转下划线
     */
    private String camelToSnake(String camelCase) {
        return camelCase.replaceAll("([a-z])([A-Z]+)", "$1_$2").toLowerCase();
    }
    
    /**
     * 获取订单状态显示文本
     */
    private String getOrderStatusDisplay(String status) {
        if (status == null) return "";
        switch (status) {
            case "draft": return "草稿";
            case "confirmed": return "已确认";
            case "in_progress": return "进行中";
            case "completed": return "已完成";
            case "cancelled": return "已取消";
            default: return status;
        }
    }
    
    /**
     * 获取支付方式显示文本
     */
    private String getPaymentMethodDisplay(String method) {
        if (method == null) return "";
        switch (method) {
            case "cash": return "现金";
            case "credit_card": return "信用卡";
            case "debit_card": return "借记卡";
            case "mobile_pay": return "移动支付";
            case "gift_card": return "礼品卡";
            default: return method;
        }
    }

    /**
     * 获取商户时区
     */
    private String getMerchantTimezone(Long tenantId) {
        try {
            // 从 merchant-service 获取商户信息
            var response = merchantServiceClient.getMerchantByTenantId(tenantId);
            if (response != null && response.isSuccess() && response.getData() != null) {
                String timezone = (String) response.getData().get("timezone");
                if (timezone != null && !timezone.isEmpty()) {
                    return timezone;
                }
            }
        } catch (Exception e) {
            log.warn("Failed to get merchant timezone for tenantId: {}, using default", tenantId, e);
        }
        // 默认使用 America/Toronto
        return "America/Toronto";
    }

}