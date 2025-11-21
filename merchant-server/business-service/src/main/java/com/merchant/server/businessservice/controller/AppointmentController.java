package com.merchant.server.businessservice.controller;

import com.merchant.server.common.annotation.Auditable;
import com.merchant.server.common.annotation.RequiresPermission;
import com.merchant.server.businessservice.entity.Appointment;
import com.merchant.server.businessservice.entity.Customer;
import com.merchant.server.businessservice.service.AppointmentService;
import com.merchant.server.businessservice.service.BusinessNotificationService;
import com.merchant.server.businessservice.service.CustomerService;
import com.merchant.server.businessservice.dto.AppointmentCreateDTO;
import com.merchant.server.businessservice.dto.CustomerDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/business/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final BusinessNotificationService notificationService;
    private final CustomerService customerService;

    /**
     * 获取租户的所有预约记录
     */
    @RequiresPermission("appointments:view")
    @GetMapping
    public ResponseEntity<List<Appointment>> getAllAppointments(@RequestParam Long tenantId) {
        List<Appointment> appointments = appointmentService.getAllAppointmentsByTenantId(tenantId);
        return ResponseEntity.ok(appointments);
    }

    /**
     * 根据ID获取单个预约详情
     */
    @RequiresPermission("appointments:view")
    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getAppointmentById(
            @PathVariable Long id,
            @RequestParam Long tenantId) {
        Appointment appointment = appointmentService.getAppointmentById(id);
        // 验证预约是否属于该租户
        if (!appointment.getTenantId().equals(tenantId)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(appointment);
    }

    /**
     * 根据客户ID获取预约记录
     */
    @RequiresPermission("appointments:view")
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Appointment>> getAppointmentsByCustomerId(
            @PathVariable Long customerId,
            @RequestParam Long tenantId) {
        List<Appointment> appointments = appointmentService.getAppointmentsByCustomerId(customerId, tenantId);
        return ResponseEntity.ok(appointments);
    }

    /**
     * 获取预约统计信息
     */
    @GetMapping("/customer/{customerId}/stats")
    public ResponseEntity<Map<String, Object>> getAppointmentStats(
            @PathVariable Long customerId,
            @RequestParam Long tenantId) {
        Map<String, Object> stats = appointmentService.getAppointmentStats(customerId, tenantId);
        return ResponseEntity.ok(stats);
    }

    /**
     * 创建新预约
     */
    @RequiresPermission("appointments:create")
    @Auditable(resource = "APPOINTMENT", action = "CREATE", recordOldValue = true, description = "Create new appointment")
    @PostMapping
    public ResponseEntity<Appointment> createAppointment(
            @RequestBody AppointmentCreateDTO appointmentDTO,
            @RequestHeader(value = "Accept-Language", defaultValue = "zh") String language) {
        Appointment created = appointmentService.createAppointmentWithServices(appointmentDTO);
        
        // 创建业务通知
        try {
            CustomerDTO customerDTO = customerService.getCustomerById(created.getCustomerId());
            // 转换CustomerDTO为Customer实体
            Customer customer = new Customer();
            customer.setId(customerDTO.getId());
            customer.setFirstName(customerDTO.getFirstName());
            customer.setLastName(customerDTO.getLastName());
            customer.setPhone(customerDTO.getPhone());
            customer.setEmail(customerDTO.getEmail());
            
            // 获取第一个服务的ID（预约可能包含多个服务）
            Long serviceId = created.getAppointmentServices() != null && !created.getAppointmentServices().isEmpty() 
                ? created.getAppointmentServices().get(0).getServiceId() : null;
            String serviceName = serviceId != null ? appointmentService.getServiceName(serviceId) : "Unknown Service";
            notificationService.createNewAppointmentNotification(created, customer, serviceName, language);
        } catch (Exception e) {
            log.error("Failed to create notification for appointment: {}", created.getId(), e);
        }
        
        return ResponseEntity.ok(created);
    }

    /**
     * 更新预约状态
     */
    @RequiresPermission("appointments:update")
    @Auditable(resource = "APPOINTMENT", action = "UPDATE_STATUS", resourceIdParam = "id", recordOldValue = true)
    @PutMapping("/{id}/status")
    public ResponseEntity<Appointment> updateAppointmentStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusUpdate,
            @RequestHeader(value = "Accept-Language", defaultValue = "zh") String language) {
        String status = statusUpdate.get("status");
        Appointment updated = appointmentService.updateAppointmentStatus(id, status);
        
        // 根据状态变化创建相应的通知
        try {
            CustomerDTO customerDTO = customerService.getCustomerById(updated.getCustomerId());
            // 转换CustomerDTO为Customer实体
            Customer customer = new Customer();
            customer.setId(customerDTO.getId());
            customer.setFirstName(customerDTO.getFirstName());
            customer.setLastName(customerDTO.getLastName());
            customer.setPhone(customerDTO.getPhone());
            customer.setEmail(customerDTO.getEmail());
            
            // 获取第一个服务的ID（预约可能包含多个服务）
            Long serviceId = updated.getAppointmentServices() != null && !updated.getAppointmentServices().isEmpty() 
                ? updated.getAppointmentServices().get(0).getServiceId() : null;
            String serviceName = serviceId != null ? appointmentService.getServiceName(serviceId) : "Unknown Service";
            
            if ("CONFIRMED".equals(status)) {
                notificationService.createAppointmentConfirmedNotification(updated, customer, serviceName, language);
            } else if ("CANCELLED".equals(status)) {
                notificationService.createAppointmentCancelledNotification(updated, customer, serviceName, language);
            }
        } catch (Exception e) {
            log.error("Failed to create notification for appointment status update: {}", id, e);
        }
        
        return ResponseEntity.ok(updated);
    }

    /**
     * 更新预约
     */
    @RequiresPermission("appointments:update")
    @Auditable(resource = "APPOINTMENT", action = "UPDATE", resourceIdParam = "id", recordOldValue = true)
    @PutMapping("/{id}")
    public ResponseEntity<Appointment> updateAppointment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> appointmentData) {
        log.info("Updating appointment: {} with data: {}", id, appointmentData);

        // 构建Appointment对象
        Appointment appointment = new Appointment();
        appointment.setId(id);

        // 设置基本字段
        if (appointmentData.containsKey("tenantId")) {
            appointment.setTenantId(((Number) appointmentData.get("tenantId")).longValue());
        }
        if (appointmentData.containsKey("customerId")) {
            appointment.setCustomerId(((Number) appointmentData.get("customerId")).longValue());
        }
        if (appointmentData.containsKey("appointmentDate")) {
            appointment.setAppointmentDate(java.time.LocalDate.parse((String) appointmentData.get("appointmentDate")));
        }
        if (appointmentData.containsKey("appointmentTime")) {
            appointment.setAppointmentTime(java.time.LocalTime.parse((String) appointmentData.get("appointmentTime")));
        }
        if (appointmentData.containsKey("duration")) {
            appointment.setDuration(((Number) appointmentData.get("duration")).intValue());
        }
        if (appointmentData.containsKey("totalAmount")) {
            appointment.setTotalAmount(new java.math.BigDecimal(appointmentData.get("totalAmount").toString()));
        }
        if (appointmentData.containsKey("status")) {
            appointment.setStatus(Appointment.AppointmentStatus.valueOf((String) appointmentData.get("status")));
        }
        if (appointmentData.containsKey("notes")) {
            appointment.setNotes((String) appointmentData.get("notes"));
        }

        // 处理服务列表
        if (appointmentData.containsKey("services") && appointmentData.get("services") != null) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> servicesData = (List<Map<String, Object>>) appointmentData.get("services");
            List<com.merchant.server.businessservice.entity.AppointmentService> appointmentServices = new ArrayList<>();

            for (Map<String, Object> serviceData : servicesData) {
                com.merchant.server.businessservice.entity.AppointmentService appointmentService =
                    new com.merchant.server.businessservice.entity.AppointmentService();

                if (serviceData.containsKey("serviceId")) {
                    appointmentService.setServiceId(((Number) serviceData.get("serviceId")).longValue());
                }
                if (serviceData.containsKey("serviceName")) {
                    appointmentService.setServiceName((String) serviceData.get("serviceName"));
                }
                if (serviceData.containsKey("price")) {
                    appointmentService.setPrice(new java.math.BigDecimal(serviceData.get("price").toString()));
                }
                if (serviceData.containsKey("duration")) {
                    appointmentService.setDuration(((Number) serviceData.get("duration")).intValue());
                }

                appointmentServices.add(appointmentService);
            }

            appointment.setAppointmentServices(appointmentServices);
        }

        // 处理资源列表
        if (appointmentData.containsKey("selectedResources") && appointmentData.get("selectedResources") != null) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> resourcesData = (List<Map<String, Object>>) appointmentData.get("selectedResources");
            List<com.merchant.server.businessservice.entity.AppointmentResource> appointmentResources = new ArrayList<>();

            for (Map<String, Object> resourceData : resourcesData) {
                com.merchant.server.businessservice.entity.AppointmentResource appointmentResource =
                    new com.merchant.server.businessservice.entity.AppointmentResource();

                if (resourceData.containsKey("id")) {
                    appointmentResource.setResourceId(((Number) resourceData.get("id")).longValue());
                }
                if (resourceData.containsKey("type")) {
                    appointmentResource.setResourceType(
                        com.merchant.server.businessservice.entity.AppointmentResource.ResourceType.valueOf((String) resourceData.get("type"))
                    );
                }
                appointmentResource.setIsPrimary(false);

                appointmentResources.add(appointmentResource);
            }

            appointment.setAppointmentResources(appointmentResources);
        }

        Appointment updated = appointmentService.updateAppointment(appointment);
        return ResponseEntity.ok(updated);
    }

    /**
     * 处理预约支付
     */
    @RequiresPermission("appointments:payment")
    @Auditable(resource = "APPOINTMENT", action = "PAYMENT", resourceIdParam = "id", description = "Process appointment payment")
    @PostMapping("/{id}/payment")
    public ResponseEntity<Appointment> processAppointmentPayment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> paymentData) {
        log.info("Processing payment for appointment: {}", id);
        log.info("Payment data: {}", paymentData);

        String paymentMethod = (String) paymentData.get("paymentMethod");
        Long tenantId = paymentData.get("tenantId") != null
            ? Long.valueOf(paymentData.get("tenantId").toString()) : null;
        Integer customerPackageId = paymentData.get("customerPackageId") != null
            ? Integer.valueOf(paymentData.get("customerPackageId").toString()) : null;
        Long verificationCodeId = paymentData.get("verificationCodeId") != null
            ? Long.valueOf(paymentData.get("verificationCodeId").toString()) : null;
        String notes = (String) paymentData.get("notes");

        // 提取税率和小费信息
        @SuppressWarnings("unchecked")
        Map<String, Object> taxInfo = (Map<String, Object>) paymentData.get("taxInfo");

        Double taxRate = null;
        Double taxAmount = null;
        Double tipAmount = null;
        Double tipPercentage = null;
        Double subtotal = null;
        Double totalAmount = null;
        String tipPaymentMethod = null;
        Double giftCardAmount = null;
        String giftCardNumber = null;
        String additionalPaymentMethod = null;
        Double additionalPaymentAmount = null;

        if (taxInfo != null) {
            taxRate = taxInfo.get("taxRate") != null ? Double.valueOf(taxInfo.get("taxRate").toString()) : null;
            taxAmount = taxInfo.get("taxAmount") != null ? Double.valueOf(taxInfo.get("taxAmount").toString()) : null;
            tipAmount = taxInfo.get("tipAmount") != null ? Double.valueOf(taxInfo.get("tipAmount").toString()) : null;
            tipPercentage = taxInfo.get("tipPercentage") != null ? Double.valueOf(taxInfo.get("tipPercentage").toString()) : null;
            subtotal = taxInfo.get("subtotal") != null ? Double.valueOf(taxInfo.get("subtotal").toString()) : null;
            totalAmount = taxInfo.get("totalAmount") != null ? Double.valueOf(taxInfo.get("totalAmount").toString()) : null;
            tipPaymentMethod = (String) taxInfo.get("tipPaymentMethod");

            log.info("Tax info - taxRate: {}, taxAmount: {}, tipAmount: {}, tipPercentage: {}, subtotal: {}, totalAmount: {}, tipPaymentMethod: {}",
                taxRate, taxAmount, tipAmount, tipPercentage, subtotal, totalAmount, tipPaymentMethod);
        }

        // 提取礼品卡支付相关信息
        if (paymentData != null) {
            if (paymentData.get("giftCardAmount") != null) {
                giftCardAmount = Double.valueOf(paymentData.get("giftCardAmount").toString());
            }
            giftCardNumber = (String) paymentData.get("giftCardNumber");
            additionalPaymentMethod = (String) paymentData.get("additionalPaymentMethod");
            if (paymentData.get("additionalPaymentAmount") != null) {
                additionalPaymentAmount = Double.valueOf(paymentData.get("additionalPaymentAmount").toString());
            }

            if (giftCardAmount != null || giftCardNumber != null || additionalPaymentMethod != null || additionalPaymentAmount != null) {
                log.info("Gift card info - amount: {}, number: {}, additionalMethod: {}, additionalAmount: {}",
                    giftCardAmount, giftCardNumber, additionalPaymentMethod, additionalPaymentAmount);
            }
        }

        // 提取支付模式 (single/unified/mixed)
        String paymentMode = (String) paymentData.get("paymentMode");
        log.info("Payment mode: {}", paymentMode);

        // 检查是否是多服务支付场景
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> servicePayments = (List<Map<String, Object>>) paymentData.get("servicePayments");

        Appointment updated;
        if (servicePayments != null && !servicePayments.isEmpty()) {
            // 多服务场景
            log.info("Processing multi-service payment with {} services", servicePayments.size());
            updated = appointmentService.processMultiServicePayment(id, paymentMethod, servicePayments, tenantId,
                taxRate, taxAmount, tipAmount, tipPercentage, subtotal, totalAmount, tipPaymentMethod, notes,
                giftCardAmount, giftCardNumber, additionalPaymentMethod, additionalPaymentAmount, paymentMode);
        } else {
            // 单服务场景
            updated = appointmentService.processPayment(id, paymentMethod, customerPackageId, tenantId, verificationCodeId,
                taxRate, taxAmount, tipAmount, tipPercentage, subtotal, totalAmount, tipPaymentMethod, notes,
                giftCardAmount, giftCardNumber, additionalPaymentMethod, additionalPaymentAmount);
        }

        log.info("Payment processed successfully for appointment: {}", id);
        return ResponseEntity.ok(updated);
    }

    /**
     * 删除预约
     */
    @RequiresPermission("appointments:delete")
    @Auditable(resource = "APPOINTMENT", action = "DELETE", resourceIdParam = "id", recordOldValue = true)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.ok().build();
    }
}