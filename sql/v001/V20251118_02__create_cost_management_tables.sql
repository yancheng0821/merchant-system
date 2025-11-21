-- 成本管理模块数据表
-- 包含：证书管理、固定成本记录、物料采购记录

-- 1. 证书管理表
CREATE TABLE IF NOT EXISTS certificates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '证书ID',
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    certificate_name VARCHAR(100) NOT NULL COMMENT '证书名称',
    certificate_type VARCHAR(50) NOT NULL COMMENT '证书类型（BUSINESS_LICENSE-营业执照, HEALTH_PERMIT-卫生许可, FIRE_PERMIT-消防许可, etc）',
    certificate_number VARCHAR(100) COMMENT '证书编号',
    issue_date DATE COMMENT '颁发日期',
    expiry_date DATE COMMENT '到期日期',
    issuing_authority VARCHAR(200) COMMENT '颁发机构',
    renewal_fee DECIMAL(10, 2) COMMENT '续费金额',
    status VARCHAR(20) DEFAULT 'VALID' COMMENT '状态（VALID-有效, EXPIRING_SOON-即将到期, EXPIRED-已过期）',
    attachment_url VARCHAR(500) COMMENT '证书附件URL',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    created_by BIGINT COMMENT '创建人ID',
    updated_by BIGINT COMMENT '更新人ID',
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_expiry_date (expiry_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='证书管理表';

-- 2. 固定成本记录表
CREATE TABLE IF NOT EXISTS fixed_costs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '固定成本ID',
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    cost_type VARCHAR(50) NOT NULL COMMENT '成本类型（RENT-租金, UTILITIES-水电, INSURANCE-保险, PROPERTY_FEE-物业费, etc）',
    cost_name VARCHAR(100) NOT NULL COMMENT '成本名称',
    amount DECIMAL(10, 2) NOT NULL COMMENT '金额',
    billing_cycle VARCHAR(20) DEFAULT 'MONTHLY' COMMENT '计费周期（MONTHLY-月度, QUARTERLY-季度, YEARLY-年度, ONE_TIME-一次性）',
    payment_date DATE NOT NULL COMMENT '支付日期',
    start_date DATE COMMENT '开始日期',
    end_date DATE COMMENT '结束日期（为空表示持续）',
    vendor VARCHAR(200) COMMENT '供应商/收款方',
    payment_method VARCHAR(50) COMMENT '支付方式（CASH-现金, CARD-银行卡, TRANSFER-转账, etc）',
    status VARCHAR(20) DEFAULT 'PAID' COMMENT '状态（PAID-已支付, PENDING-待支付, OVERDUE-逾期）',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    created_by BIGINT COMMENT '创建人ID',
    updated_by BIGINT COMMENT '更新人ID',
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_cost_type (cost_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='固定成本记录表';

-- 3. 物料采购记录表
CREATE TABLE IF NOT EXISTS material_purchases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '物料采购ID',
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    material_name VARCHAR(100) NOT NULL COMMENT '物料名称',
    material_category VARCHAR(50) NOT NULL COMMENT '物料分类（CONSUMABLES-耗材, TOOLS-工具, EQUIPMENT-设备, etc）',
    quantity DECIMAL(10, 2) NOT NULL COMMENT '数量',
    unit VARCHAR(20) DEFAULT 'PCS' COMMENT '单位（PCS-个, KG-公斤, L-升, BOX-盒, etc）',
    unit_price DECIMAL(10, 2) NOT NULL COMMENT '单价',
    total_amount DECIMAL(10, 2) NOT NULL COMMENT '总金额',
    supplier VARCHAR(200) COMMENT '供应商',
    purchase_date DATE NOT NULL COMMENT '采购日期',
    payment_status VARCHAR(20) DEFAULT 'PAID' COMMENT '支付状态（PAID-已支付, PENDING-待支付, PARTIAL-部分支付）',
    payment_method VARCHAR(50) COMMENT '支付方式（CASH-现金, CARD-银行卡, TRANSFER-转账, etc）',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    created_by BIGINT COMMENT '创建人ID',
    updated_by BIGINT COMMENT '更新人ID',
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_purchase_date (purchase_date),
    INDEX idx_category (material_category),
    INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物料采购记录表';
