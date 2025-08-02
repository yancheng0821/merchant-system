# 租户邀请码方案实现

## 1. 数据库表设计

```sql
-- 租户邀请码表
CREATE TABLE tenant_invitations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    invitation_code VARCHAR(32) UNIQUE NOT NULL,
    created_by BIGINT NOT NULL,
    max_uses INT DEFAULT 1,
    used_count INT DEFAULT 0,
    expires_at DATETIME,
    status ENUM('ACTIVE', 'EXPIRED', 'DISABLED') DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 邀请使用记录表
CREATE TABLE invitation_usage_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    invitation_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invitation_id) REFERENCES tenant_invitations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 2. 后端实现

### TenantInvitation 实体类
```java
@Data
public class TenantInvitation {
    private Long id;
    private Long tenantId;
    private String invitationCode;
    private Long createdBy;
    private Integer maxUses;
    private Integer usedCount;
    private LocalDateTime expiresAt;
    private InvitationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public enum InvitationStatus {
        ACTIVE, EXPIRED, DISABLED
    }
}
```

### 修改 RegisterRequest
```java
@Data
public class RegisterRequest {
    // ... 现有字段
    
    @NotBlank(message = "{invitation.code.required}")
    private String invitationCode; // 替换 tenantCode
}
```

### 邀请码验证服务
```java
@Service
public class TenantInvitationService {
    
    public TenantInvitation validateInvitationCode(String code) {
        TenantInvitation invitation = findByCode(code);
        
        if (invitation == null) {
            throw new BusinessException("邀请码不存在");
        }
        
        if (invitation.getStatus() != InvitationStatus.ACTIVE) {
            throw new BusinessException("邀请码已失效");
        }
        
        if (invitation.getExpiresAt() != null && 
            invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("邀请码已过期");
        }
        
        if (invitation.getUsedCount() >= invitation.getMaxUses()) {
            throw new BusinessException("邀请码使用次数已达上限");
        }
        
        return invitation;
    }
    
    public void useInvitation(Long invitationId, Long userId) {
        // 增加使用次数
        // 记录使用日志
    }
}
```

## 3. 前端改进

### 注册表单添加邀请码字段
```tsx
const [registerData, setRegisterData] = useState({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  realName: '',
  phone: '',
  invitationCode: '' // 新增
});
```

### 邀请码验证
```tsx
const validateInvitationCode = async (code: string) => {
  try {
    const response = await api.post('/auth/validate-invitation', { code });
    return response.data;
  } catch (error) {
    throw new Error('邀请码无效');
  }
};
```