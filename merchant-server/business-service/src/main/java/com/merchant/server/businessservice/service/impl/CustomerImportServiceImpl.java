package com.merchant.server.businessservice.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.server.businessservice.dto.CustomerDTO;
import com.merchant.server.businessservice.dto.CustomerImportDTO;
import com.merchant.server.businessservice.entity.Customer;
import com.merchant.server.businessservice.entity.CustomerImportLog;
import com.merchant.server.businessservice.entity.CustomerImportTemp;
import com.merchant.server.businessservice.mapper.CustomerImportLogMapper;
import com.merchant.server.businessservice.mapper.CustomerImportTempMapper;
import com.merchant.server.businessservice.service.CustomerImportService;
import com.merchant.server.businessservice.service.CustomerService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class CustomerImportServiceImpl implements CustomerImportService {
    
    private static final Logger logger = LoggerFactory.getLogger(CustomerImportServiceImpl.class);
    
    @Autowired
    private CustomerImportTempMapper tempMapper;
    
    @Autowired
    private CustomerImportLogMapper logMapper;
    
    @Autowired
    private CustomerService customerService;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // 支持的字段映射
    private static final Map<String, String> FIELD_MAPPING_OPTIONS = Map.of(
        "firstName", "姓名/名字/First Name",
        "lastName", "姓氏/Last Name", 
        "phone", "电话/手机/Phone",
        "email", "邮箱/Email",
        "address", "地址/Address",
        "dateOfBirth", "生日/出生日期/Birthday",
        "gender", "性别/Gender",
        "notes", "备注/Notes",
        "allergies", "过敏信息/Allergies"
    );
    
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[\\d\\s\\-\\+\\(\\)]{10,20}$");
    
    @Override
    @Transactional
    public CustomerImportDTO.UploadResponse uploadFile(Long tenantId, MultipartFile file) {
        try {
            logger.info("开始处理文件上传 - tenantId: {}, 文件名: {}", tenantId, file.getOriginalFilename());
            String importSessionId = UUID.randomUUID().toString();
            String fileName = file.getOriginalFilename();
            
            // 创建导入日志
            CustomerImportLog importLog = new CustomerImportLog();
            importLog.setTenantId(tenantId);
            importLog.setImportSessionId(importSessionId);
            importLog.setFileName(fileName);
            importLog.setStatus(CustomerImportLog.ImportStatus.PROCESSING);
            logMapper.save(importLog);
            logger.info("创建导入会话: {}", importSessionId);
            
            List<Map<String, Object>> data = parseFile(file);
            
            if (data.isEmpty()) {
                throw new RuntimeException("文件为空或格式不正确");
            }
            
            logger.info("文件解析完成，共 {} 行数据", data.size());
            
            // 获取列名
            List<String> detectedColumns = new ArrayList<>(data.get(0).keySet());
            logger.info("检测到的列: {}", detectedColumns);
            
            // 保存到临时表
            for (int i = 0; i < data.size(); i++) {
                CustomerImportTemp temp = new CustomerImportTemp();
                temp.setTenantId(tenantId);
                temp.setImportSessionId(importSessionId);
                temp.setRowIndex(i + 1);
                temp.setRawData(objectMapper.writeValueAsString(data.get(i)));
                temp.setStatus(CustomerImportTemp.ImportStatus.PENDING);
                tempMapper.save(temp);
            }
            
            // 更新导入日志
            importLog.setTotalRecords(data.size());
            logMapper.update(importLog);
            
            logger.info("文件上传处理完成 - 会话ID: {}, 总记录数: {}", importSessionId, data.size());
            
            // 构建响应
            CustomerImportDTO.UploadResponse response = new CustomerImportDTO.UploadResponse();
            response.setImportSessionId(importSessionId);
            response.setFileName(fileName);
            response.setTotalRecords(data.size());
            response.setDetectedColumns(detectedColumns);
            response.setSampleData(data.stream().limit(5).collect(Collectors.toList()));
            
            return response;
            
        } catch (Exception e) {
            throw new RuntimeException("文件上传失败: " + e.getMessage(), e);
        }
    }
    
    @Override
    @Transactional
    public CustomerImportDTO.PreviewResponse validateAndPreview(Long tenantId, CustomerImportDTO.MappingRequest request) {
        try {
            logger.info("开始验证和预览 - tenantId: {}, importSessionId: {}", tenantId, request.getImportSessionId());
            
            List<CustomerImportTemp> tempRecords = tempMapper.findByTenantIdAndImportSessionId(
                tenantId, request.getImportSessionId());
            
            logger.info("找到 {} 条临时记录", tempRecords.size());
            
            if (tempRecords.isEmpty()) {
                throw new RuntimeException("未找到导入数据");
            }
            
            List<CustomerImportDTO.PreviewRecord> previewRecords = new ArrayList<>();
            List<CustomerImportDTO.ValidationError> allErrors = new ArrayList<>();
            int validCount = 0;
            int invalidCount = 0;
            
            logger.info("开始验证 {} 条记录", tempRecords.size());
            
            for (CustomerImportTemp temp : tempRecords) {
                
                Map<String, Object> rawData = objectMapper.readValue(temp.getRawData(), Map.class);
                Map<String, Object> mappedData = mapFields(rawData, request.getFieldMapping());
                
                List<String> errors = validateRecord(mappedData);
                boolean isValid = errors.isEmpty();
                
                if (isValid) {
                    validCount++;
                    temp.setStatus(CustomerImportTemp.ImportStatus.VALID);
                } else {
                    invalidCount++;
                    temp.setStatus(CustomerImportTemp.ImportStatus.INVALID);
                    temp.setErrorMessage(String.join("; ", errors));
                    
                    // 添加到错误列表
                    for (String error : errors) {
                        allErrors.add(new CustomerImportDTO.ValidationError(
                            temp.getRowIndex(), "", error, null));
                    }
                }
                
                tempMapper.save(temp);
                
                CustomerImportDTO.PreviewRecord previewRecord = new CustomerImportDTO.PreviewRecord();
                previewRecord.setRowIndex(temp.getRowIndex());
                previewRecord.setData(mappedData);
                previewRecord.setIsValid(isValid);
                previewRecord.setErrors(errors);
                previewRecords.add(previewRecord);
            }
            
            logger.info("验证完成 - 有效: {}, 无效: {}", validCount, invalidCount);
            
            CustomerImportDTO.PreviewResponse response = new CustomerImportDTO.PreviewResponse();
            response.setImportSessionId(request.getImportSessionId());
            response.setTotalRecords(tempRecords.size());
            response.setValidRecords(validCount);
            response.setInvalidRecords(invalidCount);
            response.setRecords(previewRecords.stream().limit(20).collect(Collectors.toList()));
            response.setErrors(allErrors.stream().limit(50).collect(Collectors.toList()));
            
            return response;
            
        } catch (Exception e) {
            throw new RuntimeException("数据验证失败: " + e.getMessage(), e);
        }
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public CustomerImportDTO.ImportResult executeImport(Long tenantId, CustomerImportDTO.ExecuteRequest request) {
        CustomerImportLog importLog = null;
        try {
            logger.info("开始执行导入 - tenantId: {}, importSessionId: {}", tenantId, request.getImportSessionId());
            
            importLog = logMapper.findByTenantIdAndImportSessionId(
                tenantId, request.getImportSessionId());
            
            if (importLog == null) {
                logger.error("未找到导入记录 - tenantId: {}, importSessionId: {}", tenantId, request.getImportSessionId());
                throw new RuntimeException("未找到导入记录");
            }
            
            logger.info("找到导入记录 - fileName: {}, totalRecords: {}", importLog.getFileName(), importLog.getTotalRecords());
            
            List<CustomerImportTemp> validRecords = tempMapper.findByTenantIdAndImportSessionIdAndStatus(
                tenantId, request.getImportSessionId(), CustomerImportTemp.ImportStatus.VALID);
            
            logger.info("找到 {} 条有效记录", validRecords.size());
            
            int successCount = 0;
            int failedCount = 0;
            
            for (CustomerImportTemp temp : validRecords) {
                try {
                    Map<String, Object> rawData = objectMapper.readValue(temp.getRawData(), Map.class);
                    CustomerDTO customerDTO = convertToCustomerDTO(rawData, tenantId);
                    
                    // 检查是否已存在相同手机号的客户
                    try {
                        CustomerDTO existingCustomer = customerService.getCustomerByPhone(tenantId, customerDTO.getPhone());
                        if (existingCustomer != null) {
                            temp.setStatus(CustomerImportTemp.ImportStatus.INVALID);
                            temp.setErrorMessage("手机号已存在: " + customerDTO.getPhone());
                            failedCount++;
                            tempMapper.save(temp);
                            continue;
                        }
                    } catch (Exception e) {
                        // 客户不存在，可以继续创建
                    }
                    
                    customerService.createCustomer(customerDTO);
                    temp.setStatus(CustomerImportTemp.ImportStatus.IMPORTED);
                    successCount++;
                    tempMapper.save(temp);
                    
                } catch (Exception e) {
                    temp.setStatus(CustomerImportTemp.ImportStatus.INVALID);
                    temp.setErrorMessage("导入失败: " + e.getMessage());
                    failedCount++;
                    tempMapper.save(temp);
                }
            }
            
            // 更新导入日志
            updateImportLog(importLog, successCount, failedCount, CustomerImportLog.ImportStatus.COMPLETED, null);
            
            CustomerImportDTO.ImportResult result = new CustomerImportDTO.ImportResult();
            result.setImportSessionId(request.getImportSessionId());
            result.setStatus("COMPLETED");
            result.setTotalRecords(importLog.getTotalRecords());
            result.setSuccessRecords(successCount);
            result.setFailedRecords(failedCount);
            result.setMessage("导入完成");
            result.setCompletedAt(importLog.getCompletedAt());
            
            logger.info("导入执行完成 - 成功: {}, 失败: {}", successCount, failedCount);
            return result;
            
        } catch (Exception e) {
            logger.error("导入执行失败: {}", e.getMessage(), e);
            
            // 更新导入日志为失败状态
            if (importLog != null) {
                updateImportLog(importLog, 0, 0, CustomerImportLog.ImportStatus.FAILED, e.getMessage());
            }
            
            throw new RuntimeException("导入执行失败: " + e.getMessage(), e);
        }
    }
    
    @Override
    public List<CustomerImportDTO.ImportLogDTO> getImportLogs(Long tenantId) {
        try {
            logger.info("获取导入日志 - tenantId: {}", tenantId);
            List<CustomerImportLog> logs = logMapper.findByTenantIdOrderByCreatedAtDesc(tenantId);
            logger.info("找到 {} 条导入日志", logs.size());
            return logs.stream().map(this::convertToLogDTO).collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("获取导入日志失败: {}", e.getMessage(), e);
            throw new RuntimeException("获取导入日志失败: " + e.getMessage(), e);
        }
    }
    
    @Override
    public CustomerImportDTO.ImportLogDTO getImportLog(Long tenantId, String importSessionId) {
        CustomerImportLog log = logMapper.findByTenantIdAndImportSessionId(tenantId, importSessionId);
        if (log == null) {
            throw new RuntimeException("未找到导入记录");
        }
        return convertToLogDTO(log);
    }
    
    @Override
    public byte[] downloadErrorReport(Long tenantId, String importSessionId) {
        try {
            List<CustomerImportTemp> errorRecords = tempMapper.findByTenantIdAndImportSessionIdAndStatus(
                tenantId, importSessionId, CustomerImportTemp.ImportStatus.INVALID);
            
            Workbook workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet("错误报告");
            
            // 创建标题行
            Row headerRow = sheet.createRow(0);
            headerRow.createCell(0).setCellValue("行号");
            headerRow.createCell(1).setCellValue("原始数据");
            headerRow.createCell(2).setCellValue("错误信息");
            
            // 填充数据
            int rowNum = 1;
            for (CustomerImportTemp temp : errorRecords) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(temp.getRowIndex());
                row.createCell(1).setCellValue(temp.getRawData());
                row.createCell(2).setCellValue(temp.getErrorMessage());
            }
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            workbook.close();
            
            return outputStream.toByteArray();
            
        } catch (Exception e) {
            throw new RuntimeException("生成错误报告失败: " + e.getMessage(), e);
        }
    }
    
    @Override
    @Transactional
    public void cleanupTempData(String importSessionId) {
        tempMapper.deleteByImportSessionId(importSessionId);
    }
    
    /**
     * 更新导入日志（独立事务）
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    private void updateImportLog(CustomerImportLog importLog, int successRecords, int failedRecords, 
                                CustomerImportLog.ImportStatus status, String errorMessage) {
        try {
            importLog.setSuccessRecords(successRecords);
            importLog.setFailedRecords(failedRecords);
            importLog.setStatus(status);
            importLog.setCompletedAt(LocalDateTime.now());
            if (errorMessage != null) {
                importLog.setErrorMessage(errorMessage);
            }
            logMapper.update(importLog);
            logger.info("导入日志更新成功 - sessionId: {}, status: {}, success: {}, failed: {}", 
                       importLog.getImportSessionId(), status, successRecords, failedRecords);
        } catch (Exception e) {
            logger.error("更新导入日志失败: {}", e.getMessage(), e);
        }
    }
    
    // 私有方法
    private List<Map<String, Object>> parseFile(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();
        if (fileName == null) {
            throw new RuntimeException("文件名为空");
        }
        
        if (fileName.endsWith(".csv")) {
            return parseCsvFile(file);
        } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
            return parseExcelFile(file);
        } else {
            throw new RuntimeException("不支持的文件格式，请上传 CSV 或 Excel 文件");
        }
    }
    
    private List<Map<String, Object>> parseCsvFile(MultipartFile file) throws IOException {
        List<Map<String, Object>> result = new ArrayList<>();
        Scanner scanner = new Scanner(file.getInputStream(), "UTF-8");
        
        String[] headers = null;
        
        while (scanner.hasNextLine()) {
            String line = scanner.nextLine().trim();
            
            if (line.isEmpty()) {
                continue;
            }
            
            // 使用更智能的CSV解析，处理引号内的逗号
            List<String> values = parseCsvLine(line);
            
            if (headers == null) {
                headers = values.toArray(new String[0]);
                continue;
            }
            
            Map<String, Object> row = new HashMap<>();
            for (int i = 0; i < Math.min(headers.length, values.size()); i++) {
                String value = i < values.size() ? values.get(i).trim() : "";
                row.put(headers[i].trim(), value);
            }
            result.add(row);
        }
        
        scanner.close();
        return result;
    }
    
    private List<String> parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    // 处理双引号转义
                    current.append('"');
                    i++; // 跳过下一个引号
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                result.add(current.toString());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        
        result.add(current.toString());
        return result;
    }
    
    private List<Map<String, Object>> parseExcelFile(MultipartFile file) throws IOException {
        List<Map<String, Object>> result = new ArrayList<>();
        
        Workbook workbook;
        if (file.getOriginalFilename().endsWith(".xlsx")) {
            workbook = new XSSFWorkbook(file.getInputStream());
        } else {
            workbook = new HSSFWorkbook(file.getInputStream());
        }
        
        Sheet sheet = workbook.getSheetAt(0);
        Iterator<Row> rowIterator = sheet.iterator();
        
        String[] headers = null;
        while (rowIterator.hasNext()) {
            Row row = rowIterator.next();
            
            if (headers == null) {
                headers = new String[row.getLastCellNum()];
                for (int i = 0; i < row.getLastCellNum(); i++) {
                    Cell cell = row.getCell(i);
                    headers[i] = cell != null ? cell.toString().trim() : "";
                }
                continue;
            }
            
            Map<String, Object> rowData = new HashMap<>();
            for (int i = 0; i < headers.length; i++) {
                Cell cell = row.getCell(i);
                String value = cell != null ? cell.toString().trim() : "";
                rowData.put(headers[i], value);
            }
            result.add(rowData);
        }
        
        workbook.close();
        return result;
    }
    
    private Map<String, Object> mapFields(Map<String, Object> rawData, Map<String, String> fieldMapping) {
        Map<String, Object> mappedData = new HashMap<>();
        
        for (Map.Entry<String, String> mapping : fieldMapping.entrySet()) {
            String originalField = mapping.getKey();
            String systemField = mapping.getValue();
            
            if (rawData.containsKey(originalField)) {
                mappedData.put(systemField, rawData.get(originalField));
            }
        }
        
        return mappedData;
    }
    
    private List<String> validateRecord(Map<String, Object> data) {
        List<String> errors = new ArrayList<>();
        
        // 验证必填字段
        if (isEmpty(data.get("firstName"))) {
            errors.add("姓名不能为空");
        }
        if (isEmpty(data.get("lastName"))) {
            errors.add("姓氏不能为空");
        }
        if (isEmpty(data.get("phone"))) {
            errors.add("电话号码不能为空");
        }
        
        // 验证电话格式
        String phone = (String) data.get("phone");
        if (phone != null && !phone.isEmpty() && !PHONE_PATTERN.matcher(phone).matches()) {
            errors.add("电话号码格式不正确");
        }
        
        // 验证邮箱格式
        String email = (String) data.get("email");
        if (email != null && !email.isEmpty() && !EMAIL_PATTERN.matcher(email).matches()) {
            errors.add("邮箱格式不正确");
        }
        
        // 验证性别
        String gender = (String) data.get("gender");
        if (gender != null && !gender.isEmpty()) {
            try {
                Customer.Gender.valueOf(gender.toUpperCase());
            } catch (IllegalArgumentException e) {
                errors.add("性别值不正确，支持的值: MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY");
            }
        }
        
        return errors;
    }
    
    private boolean isEmpty(Object value) {
        return value == null || value.toString().trim().isEmpty();
    }
    
    private CustomerDTO convertToCustomerDTO(Map<String, Object> data, Long tenantId) {
        CustomerDTO dto = new CustomerDTO();
        dto.setTenantId(tenantId);
        dto.setFirstName((String) data.get("firstName"));
        dto.setLastName((String) data.get("lastName"));
        dto.setPhone((String) data.get("phone"));
        dto.setEmail((String) data.get("email"));
        dto.setAddress((String) data.get("address"));
        dto.setNotes((String) data.get("notes"));
        dto.setAllergies((String) data.get("allergies"));
        
        // 处理生日
        String dateOfBirth = (String) data.get("dateOfBirth");
        if (dateOfBirth != null && !dateOfBirth.isEmpty()) {
            try {
                dto.setDateOfBirth(LocalDate.parse(dateOfBirth, DateTimeFormatter.ofPattern("yyyy-MM-dd")));
            } catch (DateTimeParseException e) {
                // 忽略日期解析错误
            }
        }
        
        // 处理性别
        String gender = (String) data.get("gender");
        if (gender != null && !gender.isEmpty()) {
            try {
                dto.setGender(Customer.Gender.valueOf(gender.toUpperCase()));
            } catch (IllegalArgumentException e) {
                // 忽略性别解析错误
            }
        }
        
        // 设置默认值
        dto.setMembershipLevel(Customer.MembershipLevel.REGULAR);
        dto.setStatus(Customer.CustomerStatus.ACTIVE);
        dto.setPoints(0);
        dto.setTotalSpent(BigDecimal.ZERO);
        dto.setCommunicationPreference(Customer.CommunicationPreference.SMS);
        
        return dto;
    }
    
    private CustomerImportDTO.ImportLogDTO convertToLogDTO(CustomerImportLog log) {
        CustomerImportDTO.ImportLogDTO dto = new CustomerImportDTO.ImportLogDTO();
        dto.setId(log.getId());
        dto.setImportSessionId(log.getImportSessionId());
        dto.setFileName(log.getFileName());
        dto.setTotalRecords(log.getTotalRecords());
        dto.setSuccessRecords(log.getSuccessRecords());
        dto.setFailedRecords(log.getFailedRecords());
        dto.setStatus(log.getStatus().name());
        dto.setErrorMessage(log.getErrorMessage());
        dto.setCreatedAt(log.getCreatedAt());
        dto.setCompletedAt(log.getCompletedAt());
        return dto;
    }
}