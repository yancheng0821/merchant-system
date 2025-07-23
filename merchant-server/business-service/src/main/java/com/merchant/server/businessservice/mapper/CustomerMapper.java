package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.Customer;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CustomerMapper {
    
    /**
     * 根据ID查询客户
     */
    Customer selectById(Long id);
    
    /**
     * 根据租户ID分页查询客户
     */
    List<Customer> selectByTenantId(@Param("tenantId") Long tenantId, 
                                   @Param("offset") int offset, 
                                   @Param("limit") int limit,
                                   @Param("sortBy") String sortBy,
                                   @Param("sortDir") String sortDir);
    
    /**
     * 根据租户ID和状态分页查询客户
     */
    List<Customer> selectByTenantIdAndStatus(@Param("tenantId") Long tenantId, 
                                           @Param("status") String status,
                                           @Param("offset") int offset, 
                                           @Param("limit") int limit,
                                           @Param("sortBy") String sortBy,
                                           @Param("sortDir") String sortDir);
    
    /**
     * 根据租户ID和会员等级分页查询客户
     */
    List<Customer> selectByTenantIdAndMembershipLevel(@Param("tenantId") Long tenantId, 
                                                    @Param("membershipLevel") String membershipLevel,
                                                    @Param("offset") int offset, 
                                                    @Param("limit") int limit,
                                                    @Param("sortBy") String sortBy,
                                                    @Param("sortDir") String sortDir);
    
    /**
     * 根据租户ID、状态和会员等级分页查询客户
     */
    List<Customer> selectByTenantIdAndStatusAndMembershipLevel(@Param("tenantId") Long tenantId, 
                                                             @Param("status") String status,
                                                             @Param("membershipLevel") String membershipLevel,
                                                             @Param("offset") int offset, 
                                                             @Param("limit") int limit,
                                                             @Param("sortBy") String sortBy,
                                                             @Param("sortDir") String sortDir);
    
    /**
     * 根据租户ID和电话号码查询客户
     */
    Customer selectByTenantIdAndPhone(@Param("tenantId") Long tenantId, @Param("phone") String phone);
    
    /**
     * 根据租户ID和邮箱查询客户
     */
    Customer selectByTenantIdAndEmail(@Param("tenantId") Long tenantId, @Param("email") String email);
    
    /**
     * 搜索客户（姓名、电话、邮箱）
     */
    List<Customer> searchCustomers(@Param("tenantId") Long tenantId, 
                                 @Param("keyword") String keyword,
                                 @Param("offset") int offset, 
                                 @Param("limit") int limit,
                                 @Param("sortBy") String sortBy,
                                 @Param("sortDir") String sortDir);
    
    /**
     * 搜索客户（带状态过滤）
     */
    List<Customer> searchCustomersByStatus(@Param("tenantId") Long tenantId, 
                                         @Param("keyword") String keyword,
                                         @Param("status") String status,
                                         @Param("offset") int offset, 
                                         @Param("limit") int limit,
                                         @Param("sortBy") String sortBy,
                                         @Param("sortDir") String sortDir);
    
    /**
     * 搜索客户（带会员等级过滤）
     */
    List<Customer> searchCustomersByMembershipLevel(@Param("tenantId") Long tenantId, 
                                                  @Param("keyword") String keyword,
                                                  @Param("membershipLevel") String membershipLevel,
                                                  @Param("offset") int offset, 
                                                  @Param("limit") int limit,
                                                  @Param("sortBy") String sortBy,
                                                  @Param("sortDir") String sortDir);
    
    /**
     * 搜索客户（带状态和会员等级过滤）
     */
    List<Customer> searchCustomersByStatusAndMembershipLevel(@Param("tenantId") Long tenantId, 
                                                           @Param("keyword") String keyword,
                                                           @Param("status") String status,
                                                           @Param("membershipLevel") String membershipLevel,
                                                           @Param("offset") int offset, 
                                                           @Param("limit") int limit,
                                                           @Param("sortBy") String sortBy,
                                                           @Param("sortDir") String sortDir);
    
    /**
     * 统计租户客户总数
     */
    long countByTenantId(Long tenantId);
    
    /**
     * 统计租户客户总数（带搜索）
     */
    long countSearchCustomers(@Param("tenantId") Long tenantId, @Param("keyword") String keyword);
    
    /**
     * 统计租户客户总数（带状态过滤）
     */
    long countByTenantIdAndStatus(@Param("tenantId") Long tenantId, @Param("status") String status);
    
    /**
     * 统计租户客户总数（带搜索和状态过滤）
     */
    long countSearchCustomersByStatus(@Param("tenantId") Long tenantId, 
                                    @Param("keyword") String keyword,
                                    @Param("status") String status);
    
    /**
     * 统计租户客户总数（带会员等级过滤）
     */
    long countByTenantIdAndMembershipLevel(@Param("tenantId") Long tenantId, @Param("membershipLevel") String membershipLevel);
    
    /**
     * 统计租户客户总数（带搜索和会员等级过滤）
     */
    long countSearchCustomersByMembershipLevel(@Param("tenantId") Long tenantId, 
                                             @Param("keyword") String keyword,
                                             @Param("membershipLevel") String membershipLevel);
    
    /**
     * 统计租户客户总数（带状态和会员等级过滤）
     */
    long countByTenantIdAndStatusAndMembershipLevel(@Param("tenantId") Long tenantId, 
                                                  @Param("status") String status,
                                                  @Param("membershipLevel") String membershipLevel);
    
    /**
     * 统计租户客户总数（带搜索、状态和会员等级过滤）
     */
    long countSearchCustomersByStatusAndMembershipLevel(@Param("tenantId") Long tenantId, 
                                                      @Param("keyword") String keyword,
                                                      @Param("status") String status,
                                                      @Param("membershipLevel") String membershipLevel);
    
    /**
     * 统计VIP客户数量（金牌和白金）
     */
    long countVipCustomers(Long tenantId);
    
    /**
     * 获取客户消费排行
     */
    List<Customer> selectTopSpendingCustomers(@Param("tenantId") Long tenantId, @Param("limit") int limit);
    
    /**
     * 插入客户
     */
    int insert(Customer customer);
    
    /**
     * 更新客户
     */
    int update(Customer customer);
    
    /**
     * 删除客户
     */
    int deleteById(Long id);
    
    /**
     * 检查电话号码是否存在
     */
    boolean existsByTenantIdAndPhone(@Param("tenantId") Long tenantId, @Param("phone") String phone);
    
    /**
     * 检查邮箱是否存在
     */
    boolean existsByTenantIdAndEmail(@Param("tenantId") Long tenantId, @Param("email") String email);

    List<Customer> findByCondition(@Param("tenantId") Long tenantId, 
                                  @Param("keyword") String keyword, 
                                  @Param("status") Customer.CustomerStatus status, 
                                  @Param("level") Customer.MembershipLevel level,
                                  @Param("sortBy") String sortBy,
                                  @Param("sortDir") String sortDir);
    
    /**
     * 查询客户偏好服务ID列表
     */
    List<Long> selectPreferredServiceIds(Long customerId);
    
    /**
     * 插入客户偏好服务
     */
    int insertPreferredServices(@Param("customerId") Long customerId, @Param("serviceIds") List<Long> serviceIds);
    
    /**
     * 删除客户偏好服务
     */
    int deletePreferredServices(@Param("customerId") Long customerId);
}