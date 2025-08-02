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
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_invitation_code (invitation_code),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_status (status)
);

-- 邀请使用记录表
CREATE TABLE invitation_usage_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    invitation_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invitation_id) REFERENCES tenant_invitations(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_invitation_id (invitation_id),
    INDEX idx_user_id (user_id)
);