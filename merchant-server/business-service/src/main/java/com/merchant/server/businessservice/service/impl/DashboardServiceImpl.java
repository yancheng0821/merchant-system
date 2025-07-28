package com.merchant.server.businessservice.service.impl;

import com.merchant.server.businessservice.mapper.OrderMapper;
import com.merchant.server.businessservice.mapper.CustomerMapper;
import com.merchant.server.businessservice.mapper.AppointmentMapper;
import com.merchant.server.businessservice.mapper.ServiceMapper;
import com.merchant.server.businessservice.service.DashboardService;
import com.merchant.server.common.util.TimeZoneUtils; 
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Dashboard 服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {
    
    private final OrderMapper orderMapper;
    private final CustomerMapper customerMapper;
    private final AppointmentMapper appointmentMapper;
    private final ServiceMapper serviceMapper;
    
    @Override
    public Map<String, Object> getDashboardStats(Long tenantId, int days) {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            // 获取日期范围
            LocalDate endDate = TimeZoneUtils.getCurrentVancouverDate();
            LocalDate startDate = endDate.minusDays(days - 1);
            
            // 订单统计
            Map<String, Object> orderStats = getOrderStatistics(tenantId, startDate, endDate);
            stats.putAll(orderStats);
            
            // 客户统计
            Map<String, Object> customerStats = getCustomerStatistics(tenantId, startDate, endDate);
            stats.putAll(customerStats);
            
            // 预约统计
            Map<String, Object> appointmentStats = getAppointmentStatistics(tenantId, startDate, endDate);
            stats.putAll(appointmentStats);
            
            // 收入统计
            Map<String, Object> revenueStats = getRevenueStatistics(tenantId, startDate, endDate);
            stats.putAll(revenueStats);
            
        } catch (Exception e) {
            log.error("Error fetching dashboard stats for tenant: {}", tenantId, e);
            // 返回默认值
            stats.put("totalOrders", 0);
            stats.put("totalRevenue", 0.0);
            stats.put("totalCustomers", 0);
            stats.put("totalAppointments", 0);
            stats.put("avgOrderValue", 0.0);
            stats.put("revenueGrowth", 0.0);
            stats.put("orderGrowth", 0.0);
            stats.put("customerGrowth", 0.0);
        }
        
        return stats;
    }
    
    @Override
    public Map<String, Object> getSalesTrend(Long tenantId, int days) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> trendData = new ArrayList<>();
        
        try {
            LocalDate endDate = TimeZoneUtils.getCurrentVancouverDate();
            LocalDate startDate = endDate.minusDays(days - 1);
            
            // 按日期分组获取真实销售数据
            for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
                Map<String, Object> dayData = new HashMap<>();
                String dateStr = date.format(DateTimeFormatter.ofPattern("MM-dd"));
                
                // 获取当天的订单数据
                List<Map<String, Object>> dayOrders = orderMapper.selectOrdersByDate(tenantId, date.toString());
                
                int orderCount = dayOrders.size();
                double revenue = dayOrders.stream()
                    .filter(order -> "paid".equals(order.get("payment_status")))
                    .mapToDouble(order -> {
                        Object totalAmount = order.get("total_amount");
                        if (totalAmount instanceof Number) {
                            return ((Number) totalAmount).doubleValue();
                        }
                        return 0.0;
                    })
                    .sum();
                
                // 获取当天的预约数据（作为访客数据的代理）
                int appointments = appointmentMapper.countAppointmentsByDate(tenantId, date.toString());
                
                dayData.put("date", dateStr);
                dayData.put("orders", orderCount);
                dayData.put("sales", Math.round(revenue));
                dayData.put("visitors", appointments * 2); // 假设每个预约代表2个访客
                
                trendData.add(dayData);
            }
            
            result.put("data", trendData);
            result.put("success", true);
            
        } catch (Exception e) {
            log.error("Error fetching sales trend for tenant: {}", tenantId, e);
            result.put("data", new ArrayList<>());
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public Map<String, Object> getServiceCategoryStats(Long tenantId, int days) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> categoryData = new ArrayList<>();
        
        try {
            LocalDate endDate = TimeZoneUtils.getCurrentVancouverDate();
            LocalDate startDate = endDate.minusDays(days - 1);
            
            // 获取真实的服务分类统计
            List<Map<String, Object>> categoryStats = serviceMapper.getServiceCategoryStats(tenantId, startDate.toString(), endDate.toString());
            
            // 计算总数用于百分比计算
            int totalCount = categoryStats.stream()
                .mapToInt(stat -> {
                    Object count = stat.get("order_count");
                    return count instanceof Number ? ((Number) count).intValue() : 0;
                })
                .sum();
            
            // 转换数据格式
            for (Map<String, Object> stat : categoryStats) {
                Map<String, Object> category = new HashMap<>();
                String categoryName = (String) stat.get("category_name");
                category.put("name", categoryName != null ? categoryName : "Uncategorized");
                
                int count = stat.get("order_count") instanceof Number ? 
                    ((Number) stat.get("order_count")).intValue() : 0;
                
                // 如果没有订单数据，显示分类但设置为0
                double percentage = totalCount > 0 ? (double) count / totalCount * 100 : 
                    (categoryStats.size() > 0 ? 100.0 / categoryStats.size() : 100.0);
                category.put("value", Math.round(percentage * 10) / 10.0); // 保留一位小数
                category.put("count", count);
                
                categoryData.add(category);
            }
            
            // 如果没有分类数据，添加默认分类
            if (categoryData.isEmpty()) {
                Map<String, Object> defaultCategory = new HashMap<>();
                defaultCategory.put("name", "No Data");
                defaultCategory.put("value", 100.0);
                defaultCategory.put("count", 0);
                categoryData.add(defaultCategory);
            }
            
            result.put("data", categoryData);
            result.put("success", true);
            
        } catch (Exception e) {
            log.error("Error fetching service category stats for tenant: {}", tenantId, e);
            result.put("data", new ArrayList<>());
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public Map<String, Object> getTopServices(Long tenantId, int days, int limit) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> topServices = new ArrayList<>();
        
        try {
            LocalDate endDate = TimeZoneUtils.getCurrentVancouverDate();
            LocalDate startDate = endDate.minusDays(days - 1);
            
            log.debug("Fetching top services for tenant: {}, date range: {} to {}, limit: {}", tenantId, startDate, endDate, limit);
            
            // 获取真实的热门服务统计
            List<Map<String, Object>> serviceStats = serviceMapper.getTopServices(tenantId, startDate.toString(), endDate.toString(), limit);
            
            log.debug("Found {} service stats for tenant: {}", serviceStats.size(), tenantId);
            
            for (Map<String, Object> stat : serviceStats) {
                Map<String, Object> service = new HashMap<>();
                String serviceName = (String) stat.get("service_name");
                service.put("name", serviceName != null ? serviceName : "Unknown Service");
                
                double revenue = stat.get("total_revenue") instanceof Number ? 
                    ((Number) stat.get("total_revenue")).doubleValue() : 0;
                service.put("sales", Math.round(revenue));
                
                int orderCount = stat.get("order_count") instanceof Number ? 
                    ((Number) stat.get("order_count")).intValue() : 0;
                
                // 计算增长率（这里使用简单的随机增长率，实际应该与上期对比）
                // TODO: 实现真实的增长率计算
                double growth = orderCount > 0 ? (Math.random() - 0.5) * 50 : 0; // -25% 到 +25% 的随机增长率
                service.put("growth", Math.round(growth * 10) / 10.0);
                
                // log.debug("Service: {}, Revenue: {}, Orders: {}", serviceName, revenue, orderCount);
                
                topServices.add(service);
            }
            
            // 如果没有数据，添加默认提示
            if (topServices.isEmpty()) {
                log.warn("No top services data found for tenant: {}", tenantId);
                Map<String, Object> defaultService = new HashMap<>();
                defaultService.put("name", "No Data");
                defaultService.put("sales", 0);
                defaultService.put("growth", 0.0);
                topServices.add(defaultService);
            }
            
            result.put("data", topServices);
            result.put("success", true);
            
        } catch (Exception e) {
            log.error("Error fetching top services for tenant: {}", tenantId, e);
            result.put("data", new ArrayList<>());
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        
        return result;
    }
    
    private Map<String, Object> getOrderStatistics(Long tenantId, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> stats = new HashMap<>();
        
        // 获取期间内的真实订单数据
        List<Map<String, Object>> orders = orderMapper.selectOrdersByDateRange(tenantId, startDate.toString(), endDate.toString());
        
        int totalOrders = orders.size();
        double totalRevenue = orders.stream()
            .filter(order -> "paid".equals(order.get("payment_status")))
            .mapToDouble(order -> {
                Object totalAmount = order.get("total_amount");
                return totalAmount instanceof Number ? ((Number) totalAmount).doubleValue() : 0.0;
            })
            .sum();
        
        double avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0.0;
        
        // 计算增长率（与上一期间对比）
        LocalDate prevStartDate = startDate.minusDays(endDate.toEpochDay() - startDate.toEpochDay() + 1);
        LocalDate prevEndDate = startDate.minusDays(1);
        
        List<Map<String, Object>> prevOrders = orderMapper.selectOrdersByDateRange(tenantId, prevStartDate.toString(), prevEndDate.toString());
        int prevTotalOrders = prevOrders.size();
        double prevTotalRevenue = prevOrders.stream()
            .filter(order -> "paid".equals(order.get("payment_status")))
            .mapToDouble(order -> {
                Object totalAmount = order.get("total_amount");
                return totalAmount instanceof Number ? ((Number) totalAmount).doubleValue() : 0.0;
            })
            .sum();
        
        double orderGrowth = prevTotalOrders > 0 ? ((double) totalOrders - prevTotalOrders) / prevTotalOrders * 100 : 0.0;
        double revenueGrowth = prevTotalRevenue > 0 ? (totalRevenue - prevTotalRevenue) / prevTotalRevenue * 100 : 0.0;
        
        stats.put("totalOrders", totalOrders);
        stats.put("totalRevenue", totalRevenue);
        stats.put("avgOrderValue", avgOrderValue);
        stats.put("orderGrowth", Math.round(orderGrowth * 10) / 10.0);
        stats.put("revenueGrowth", Math.round(revenueGrowth * 10) / 10.0);
        
        return stats;
    }
    
    private Map<String, Object> getCustomerStatistics(Long tenantId, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> stats = new HashMap<>();
        
        // 获取真实的客户数据
        int totalCustomers = (int)customerMapper.countByTenantId(tenantId);
        int newCustomers = customerMapper.countNewCustomersByDateRange(tenantId, startDate.toString(), endDate.toString());
        
        // 计算客户增长率
        int prevNewCustomers = customerMapper.countNewCustomersByDateRange(tenantId, 
            startDate.minusDays(endDate.toEpochDay() - startDate.toEpochDay() + 1).toString(), 
            startDate.minusDays(1).toString());
        
        double customerGrowth = prevNewCustomers > 0 ? ((double) newCustomers - prevNewCustomers) / prevNewCustomers * 100 : 0.0;
        
        stats.put("totalCustomers", totalCustomers);
        stats.put("newCustomers", newCustomers);
        stats.put("customerGrowth", Math.round(customerGrowth * 10) / 10.0);
        
        return stats;
    }
    
    private Map<String, Object> getAppointmentStatistics(Long tenantId, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> stats = new HashMap<>();
        
        // 获取真实的预约数据
        int totalAppointments = appointmentMapper.countAppointmentsByDateRange(tenantId, startDate.toString(), endDate.toString());
        
        // 计算预约增长率
        int prevAppointments = appointmentMapper.countAppointmentsByDateRange(tenantId,
            startDate.minusDays(endDate.toEpochDay() - startDate.toEpochDay() + 1).toString(),
            startDate.minusDays(1).toString());
        
        double appointmentGrowth = prevAppointments > 0 ? ((double) totalAppointments - prevAppointments) / prevAppointments * 100 : 0.0;
        
        stats.put("totalAppointments", totalAppointments);
        stats.put("appointmentGrowth", Math.round(appointmentGrowth * 10) / 10.0);
        
        return stats;
    }
    
    private Map<String, Object> getRevenueStatistics(Long tenantId, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> stats = new HashMap<>();
        
        // 这里可以添加更详细的收入统计逻辑
        // 目前在 getOrderStatistics 中已经包含了基本的收入统计
        
        return stats;
    }
}