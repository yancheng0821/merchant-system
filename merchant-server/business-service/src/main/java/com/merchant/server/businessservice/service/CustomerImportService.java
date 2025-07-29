package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.dto.CustomerImportDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CustomerImportService {
    
    /**
     * 上传文件并解析
     */
    CustomerImportDTO.UploadResponse uploadFile(Long tenantId, MultipartFile file);
    
    /**
     * 设置字段映射并验证数据
     */
    CustomerImportDTO.PreviewResponse validateAndPreview(Long tenantId, CustomerImportDTO.MappingRequest request);
    
    /**
     * 执行导入
     */
    CustomerImportDTO.ImportResult executeImport(Long tenantId, CustomerImportDTO.ExecuteRequest request);
    
    /**
     * 获取导入日志列表
     */
    List<CustomerImportDTO.ImportLogDTO> getImportLogs(Long tenantId);
    
    /**
     * 获取导入详情
     */
    CustomerImportDTO.ImportLogDTO getImportLog(Long tenantId, String importSessionId);
    
    /**
     * 下载错误报告
     */
    byte[] downloadErrorReport(Long tenantId, String importSessionId);
    
    /**
     * 清理临时数据
     */
    void cleanupTempData(String importSessionId);
}