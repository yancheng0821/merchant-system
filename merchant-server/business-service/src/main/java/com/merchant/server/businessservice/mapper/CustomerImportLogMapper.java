package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.CustomerImportLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CustomerImportLogMapper {
    
    /**
     * 插入导入日志记录
     */
    void save(CustomerImportLog customerImportLog);
    
    /**
     * 根据租户ID和导入会话ID查询
     */
    CustomerImportLog findByTenantIdAndImportSessionId(
        @Param("tenantId") Long tenantId, 
        @Param("importSessionId") String importSessionId);
    
    /**
     * 根据租户ID查询，按创建时间倒序
     */
    List<CustomerImportLog> findByTenantIdOrderByCreatedAtDesc(@Param("tenantId") Long tenantId);
    
    /**
     * 更新导入日志记录
     */
    void update(CustomerImportLog customerImportLog);
}