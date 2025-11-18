package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.Certificate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 证书管理Mapper
 */
@Mapper
public interface CertificateMapper {

    /**
     * 根据租户ID查询所有证书
     */
    List<Certificate> selectByTenantId(@Param("tenantId") Long tenantId);

    /**
     * 根据ID查询证书
     */
    Certificate selectById(@Param("id") Long id);

    /**
     * 插入证书
     */
    int insert(Certificate certificate);

    /**
     * 更新证书
     */
    int update(Certificate certificate);

    /**
     * 删除证书
     */
    int deleteById(@Param("id") Long id);
}
