package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.CustomerImportTemp;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CustomerImportTempMapper {
    
    /**
     * 插入临时导入记录
     */
    void save(CustomerImportTemp customerImportTemp);
    
    /**
     * 根据租户ID和导入会话ID查询
     */
    List<CustomerImportTemp> findByTenantIdAndImportSessionId(
        @Param("tenantId") Long tenantId, 
        @Param("importSessionId") String importSessionId);
    
    /**
     * 根据租户ID、导入会话ID和状态查询
     */
    List<CustomerImportTemp> findByTenantIdAndImportSessionIdAndStatus(
        @Param("tenantId") Long tenantId, 
        @Param("importSessionId") String importSessionId, 
        @Param("status") CustomerImportTemp.ImportStatus status);
    
    /**
     * 根据导入会话ID删除记录
     */
    void deleteByImportSessionId(@Param("importSessionId") String importSessionId);
    
    /**
     * 统计符合条件的记录数量
     */
    long countByTenantIdAndImportSessionIdAndStatus(
        @Param("tenantId") Long tenantId, 
        @Param("importSessionId") String importSessionId, 
        @Param("status") CustomerImportTemp.ImportStatus status);
    
    /**
     * 更新记录状态
     */
    void updateStatus(@Param("id") Long id, @Param("status") String status, @Param("errorMessage") String errorMessage);
}