package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.POSTerminal;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

/**
 * POS终端Mapper接口
 */
@Mapper
public interface POSTerminalMapper {
    
    /**
     * 根据终端ID和租户ID查询
     */
    POSTerminal selectByTerminalId(@Param("terminalId") String terminalId, @Param("tenantId") Long tenantId);
    
    /**
     * 查询活跃的终端
     */
    List<POSTerminal> selectActiveTerminals(@Param("tenantId") Long tenantId);
}