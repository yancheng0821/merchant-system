package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.dto.CustomerImportDTO;
import com.merchant.server.businessservice.service.CustomerImportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/business/customers/import")
public class CustomerImportController {
    
    private static final Logger logger = LoggerFactory.getLogger(CustomerImportController.class);
    
    @Autowired
    private CustomerImportService customerImportService;
    
    /**
     * 上传文件
     */
    @PostMapping("/upload")
    public ResponseEntity<CustomerImportDTO.UploadResponse> uploadFile(
            @RequestParam Long tenantId,
            @RequestParam("file") MultipartFile file) {
        
        try {
            logger.info("收到文件上传请求 - tenantId: {}, 文件名: {}, 大小: {} bytes", 
                       tenantId, file.getOriginalFilename(), file.getSize());
            
            if (file.isEmpty()) {
                throw new RuntimeException("文件不能为空");
            }
            
            // 检查文件大小 (限制为10MB)
            if (file.getSize() > 10 * 1024 * 1024) {
                throw new RuntimeException("文件大小不能超过10MB");
            }
            
            // 检查文件类型
            String fileName = file.getOriginalFilename();
            if (fileName == null || (!fileName.endsWith(".csv") && !fileName.endsWith(".xlsx") && !fileName.endsWith(".xls"))) {
                throw new RuntimeException("只支持 CSV 和 Excel 文件格式");
            }
            
            CustomerImportDTO.UploadResponse response = customerImportService.uploadFile(tenantId, file);
            logger.info("文件上传处理完成 - 检测到 {} 列，共 {} 行数据", 
                       response.getDetectedColumns().size(), response.getTotalRecords());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("文件上传失败: {}", e.getMessage(), e);
            throw new RuntimeException("文件上传失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 字段映射和数据验证
     */
    @PostMapping("/mapping")
    public ResponseEntity<CustomerImportDTO.PreviewResponse> validateMapping(
            @RequestParam Long tenantId,
            @RequestBody CustomerImportDTO.MappingRequest request) {
        
        try {
            logger.info("开始验证映射 - tenantId: {}, importSessionId: {}, fieldMapping: {}", 
                       tenantId, request.getImportSessionId(), request.getFieldMapping());
            
            CustomerImportDTO.PreviewResponse response = customerImportService.validateAndPreview(tenantId, request);
            
            logger.info("验证完成 - 总记录数: {}, 有效记录: {}, 无效记录: {}", 
                       response.getTotalRecords(), response.getValidRecords(), response.getInvalidRecords());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("数据验证失败: {}", e.getMessage(), e);
            throw new RuntimeException("数据验证失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 执行导入
     */
    @PostMapping("/execute")
    public ResponseEntity<CustomerImportDTO.ImportResult> executeImport(
            @RequestParam Long tenantId,
            @RequestBody CustomerImportDTO.ExecuteRequest request) {
        
        try {
            logger.info("收到导入执行请求 - tenantId: {}, importSessionId: {}", 
                       tenantId, request.getImportSessionId());
            
            CustomerImportDTO.ImportResult result = customerImportService.executeImport(tenantId, request);
            
            logger.info("导入执行完成 - 总记录数: {}, 成功记录: {}, 失败记录: {}", 
                       result.getTotalRecords(), result.getSuccessRecords(), result.getFailedRecords());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("导入执行失败: {}", e.getMessage(), e);
            throw new RuntimeException("导入执行失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 获取导入日志列表
     */
    @GetMapping("/logs")
    public ResponseEntity<Map<String, Object>> getImportLogs(
            @RequestParam Long tenantId) {
        
        try {
            List<CustomerImportDTO.ImportLogDTO> logs = customerImportService.getImportLogs(tenantId);
            Map<String, Object> response = new HashMap<>();
            response.put("data", logs);
            response.put("success", true);
            response.put("message", "获取导入日志成功");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            throw new RuntimeException("获取导入日志失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 获取导入详情
     */
    @GetMapping("/logs/{importSessionId}")
    public ResponseEntity<CustomerImportDTO.ImportLogDTO> getImportLog(
            @RequestParam Long tenantId,
            @PathVariable String importSessionId) {
        
        try {
            CustomerImportDTO.ImportLogDTO log = customerImportService.getImportLog(tenantId, importSessionId);
            return ResponseEntity.ok(log);
            
        } catch (Exception e) {
            throw new RuntimeException("获取导入详情失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 下载错误报告
     */
    @GetMapping("/logs/{importSessionId}/error-report")
    public ResponseEntity<byte[]> downloadErrorReport(
            @RequestParam Long tenantId,
            @PathVariable String importSessionId) {
        
        try {
            byte[] report = customerImportService.downloadErrorReport(tenantId, importSessionId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "error-report-" + importSessionId + ".xlsx");
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(report);
                
        } catch (Exception e) {
            throw new RuntimeException("下载错误报告失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 清理临时数据
     */
    @DeleteMapping("/cleanup/{importSessionId}")
    public ResponseEntity<Map<String, String>> cleanupTempData(
            @PathVariable String importSessionId) {
        
        try {
            customerImportService.cleanupTempData(importSessionId);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "临时数据清理成功");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            throw new RuntimeException("清理临时数据失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 获取字段映射选项
     */
    @GetMapping("/field-options")
    public ResponseEntity<Map<String, Object>> getFieldOptions() {
        Map<String, Object> options = new HashMap<>();
        
        // 系统字段选项
        Map<String, String> systemFields = new HashMap<>();
        systemFields.put("firstName", "名字");
        systemFields.put("lastName", "姓氏");
        systemFields.put("phone", "电话");
        systemFields.put("email", "邮箱");
        systemFields.put("address", "地址");
        systemFields.put("dateOfBirth", "生日");
        systemFields.put("gender", "性别");
        systemFields.put("notes", "备注");
        systemFields.put("allergies", "过敏信息");
        
        options.put("systemFields", systemFields);
        
        // 性别选项
        Map<String, String> genderOptions = new HashMap<>();
        genderOptions.put("MALE", "男");
        genderOptions.put("FEMALE", "女");
        genderOptions.put("OTHER", "其他");
        genderOptions.put("PREFER_NOT_TO_SAY", "不愿透露");
        
        options.put("genderOptions", genderOptions);
        
        return ResponseEntity.ok(options);
    }
    
    /**
     * 异常处理
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException e) {
        logger.error("RuntimeException caught: {}", e.getMessage(), e);
        Map<String, String> error = new HashMap<>();
        error.put("error", e.getMessage());
        error.put("type", e.getClass().getSimpleName());
        return ResponseEntity.badRequest().body(error);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleException(Exception e) {
        logger.error("Exception caught: {}", e.getMessage(), e);
        Map<String, String> error = new HashMap<>();
        error.put("error", "服务器内部错误: " + e.getMessage());
        error.put("type", e.getClass().getSimpleName());
        return ResponseEntity.status(500).body(error);
    }
}