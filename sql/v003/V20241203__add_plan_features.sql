-- ============================================================================
-- 订阅计划功能限制
-- 日期: 2024-12-03
-- 说明: 三个计划 BASIC $129 | PRO $199 | ELITE $299
-- ============================================================================
use merchant_management;

-- 1. 在 subscription_plans 表添加功能配置JSON字段
ALTER TABLE subscription_plans
ADD COLUMN features JSON COMMENT '功能配置JSON';

-- 2. 删除FREE计划相关数据
DELETE FROM tenant_subscriptions WHERE plan_id IN (SELECT id FROM subscription_plans WHERE plan_code = 'FREE');
DELETE FROM subscription_plans WHERE plan_code = 'FREE';

-- 3. 更新 BASIC 计划
UPDATE subscription_plans SET
    plan_name_en = 'Basic',
    plan_name_zh = '基础版',
    monthly_price = 129.00,
    yearly_price = 1290.00,
    max_users = -1,
    max_staff = 5,
    max_appointments_per_month = 100,
    trial_days = 14,
    features = '{
      "limits": {
        "maxStaff": 5,
        "maxAppointmentsPerMonth": 100,
        "maxEmailsPerMonth": 300,
        "maxSmsPerMonth": 0
      },
      "modules": {
        "dashboard": true,
        "appointments": true,
        "schedule": true,
        "customers": true,
        "orders": true,
        "products": true,
        "resources": true,
        "settings": true,
        "notifications": true,
        "marketing": false,
        "analytics": false,
        "costs": false,
        "rbac": true
      },
      "features": {
        "appLogin": false,
        "onlineBooking": false,
        "notificationTemplateEdit": false,
        "customerImport": false,
        "smsNotification": false,
        "auditLog": false,
        "removeBranding": false,
        "futureFeatures": false
      }
    }'
WHERE plan_code = 'BASIC';

-- 4. 更新 PRO 计划
UPDATE subscription_plans SET
    plan_name_en = 'Professional',
    plan_name_zh = '专业版',
    monthly_price = 199.00,
    yearly_price = 1990.00,
    max_users = -1,
    max_staff = 15,
    max_appointments_per_month = 500,
    trial_days = 14,
    features = '{
      "limits": {
        "maxStaff": 15,
        "maxAppointmentsPerMonth": 500,
        "maxEmailsPerMonth": 1500,
        "maxSmsPerMonth": 100
      },
      "modules": {
        "dashboard": true,
        "appointments": true,
        "schedule": true,
        "customers": true,
        "orders": true,
        "products": true,
        "resources": true,
        "settings": true,
        "notifications": true,
        "marketing": false,
        "analytics": false,
        "costs": false,
        "rbac": true
      },
      "features": {
        "appLogin": true,
        "onlineBooking": true,
        "notificationTemplateEdit": true,
        "customerImport": true,
        "smsNotification": true,
        "auditLog": false,
        "removeBranding": false,
        "futureFeatures": false
      }
    }'
WHERE plan_code = 'PRO';

-- 5. 更新 ELITE 计划
UPDATE subscription_plans SET
    plan_name_en = 'Elite',
    plan_name_zh = '旗舰版',
    monthly_price = 299.00,
    yearly_price = 2990.00,
    max_users = -1,
    max_staff = -1,
    max_appointments_per_month = -1,
    trial_days = 14,
    features = '{
      "limits": {
        "maxStaff": -1,
        "maxAppointmentsPerMonth": -1,
        "maxEmailsPerMonth": -1,
        "maxSmsPerMonth": -1
      },
      "modules": {
        "dashboard": true,
        "appointments": true,
        "schedule": true,
        "customers": true,
        "orders": true,
        "products": true,
        "resources": true,
        "settings": true,
        "notifications": true,
        "marketing": true,
        "analytics": true,
        "costs": true,
        "rbac": true
      },
      "features": {
        "appLogin": true,
        "onlineBooking": true,
        "notificationTemplateEdit": true,
        "customerImport": true,
        "smsNotification": true,
        "auditLog": true,
        "removeBranding": true,
        "futureFeatures": true,
        "multiLocation": true,
        "aiInsights": true,
        "stripeTerminal": true
      }
    }'
WHERE plan_code = 'ELITE';

-- 6. 创建功能定义表（用于管理界面展示）
CREATE TABLE IF NOT EXISTS plan_feature_definitions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    feature_code VARCHAR(100) NOT NULL UNIQUE COMMENT '功能代码',
    feature_name_en VARCHAR(100) NOT NULL,
    feature_name_zh VARCHAR(100) NOT NULL,
    feature_type ENUM('MODULE', 'FEATURE', 'LIMIT') NOT NULL DEFAULT 'FEATURE',
    min_plan ENUM('BASIC', 'PRO', 'ELITE') NOT NULL DEFAULT 'BASIC',
    description_zh VARCHAR(500),
    is_future TINYINT(1) DEFAULT 0 COMMENT '是否为未来功能',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_min_plan (min_plan),
    INDEX idx_feature_type (feature_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 插入功能定义数据
INSERT INTO plan_feature_definitions (feature_code, feature_name_en, feature_name_zh, feature_type, min_plan, description_zh, is_future, sort_order) VALUES
-- 核心模块 (BASIC)
('dashboard', 'Dashboard', '仪表盘', 'MODULE', 'BASIC', '业务数据总览', 0, 1),
('schedule', 'Schedule', '日程管理', 'MODULE', 'BASIC', '预约创建、排班和结算', 0, 2),
('appointments', 'Appointments', '预约记录', 'MODULE', 'BASIC', '查看预约记录', 0, 3),
('orders', 'Orders', '订单记录', 'MODULE', 'BASIC', '查看订单记录', 0, 4),
('customers', 'Customers', '客户管理', 'MODULE', 'BASIC', '客户信息和会员等级', 0, 5),
('products', 'Services', '服务管理', 'MODULE', 'BASIC', '服务项目和套餐', 0, 6),
('resources', 'Staff', '员工管理', 'MODULE', 'BASIC', '员工信息管理', 0, 7),
('settings', 'Settings', '系统设置', 'MODULE', 'BASIC', '商户基础设置', 0, 8),
('notifications', 'Notifications', '通知管理', 'MODULE', 'BASIC', '查看通知发送记录', 0, 9),
('rbac', 'User Management', '用户管理', 'MODULE', 'BASIC', '用户和预设角色分配', 0, 10),

-- PRO 功能
('appLogin', 'App Login', 'App登录', 'FEATURE', 'PRO', '移动端App登录权限', 0, 20),
('onlineBooking', 'Online Booking', '在线预约', 'FEATURE', 'PRO', '公开在线预约页面', 0, 21),
('notificationTemplateEdit', 'Notification Templates', '通知模板编辑', 'FEATURE', 'PRO', '自定义邮件/短信模板', 0, 22),
('customerImport', 'Customer Import', '客户导入', 'FEATURE', 'PRO', '批量导入客户数据', 0, 23),
('smsNotification', 'SMS Notification', '短信通知', 'FEATURE', 'PRO', '短信通知功能', 0, 24),

-- ELITE 模块
('marketing', 'Marketing', '营销中心', 'MODULE', 'ELITE', '营销规则和自动化提醒', 0, 30),
('analytics', 'Analytics', '数据分析', 'MODULE', 'ELITE', '业务数据分析报表', 0, 31),
('costs', 'Cost Management', '成本管理', 'MODULE', 'ELITE', '成本和支出管理', 0, 32),

-- ELITE 功能
('auditLog', 'Audit Log', '审计日志', 'FEATURE', 'ELITE', '系统数据变更记录', 0, 40),
('removeBranding', 'Remove Branding', '去除品牌标识', 'FEATURE', 'ELITE', '去除Powered by标识', 0, 41),
('futureFeatures', 'Future Features', '未来新功能', 'FEATURE', 'ELITE', '后续扩展功能自动适用', 0, 42),

-- ELITE 未来功能
('multiLocation', 'Multi-location', '多店铺管理', 'FEATURE', 'ELITE', '管理多个店铺', 1, 50),
('aiInsights', 'AI Insights', 'AI商业洞察', 'FEATURE', 'ELITE', 'AI驱动的业务分析', 1, 51),
('stripeTerminal', 'Stripe Terminal', 'Stripe终端', 'FEATURE', 'ELITE', 'Stripe硬件终端集成', 1, 52),

-- 数量限制
('maxStaff', 'Staff Limit', '员工数量限制', 'LIMIT', 'BASIC', 'BASIC:5 / PRO:15 / ELITE:无限', 0, 60),
('maxAppointmentsPerMonth', 'Monthly Appointments', '月预约数量', 'LIMIT', 'BASIC', 'BASIC:100 / PRO:500 / ELITE:无限', 0, 61),
('maxEmailsPerMonth', 'Monthly Emails', '月邮件数量', 'LIMIT', 'BASIC', 'BASIC:300 / PRO:1500 / ELITE:无限', 0, 62),
('maxSmsPerMonth', 'Monthly SMS', '月短信数量', 'LIMIT', 'PRO', 'PRO:100 / ELITE:无限', 0, 63);

-- 8. 创建使用量统计表
CREATE TABLE IF NOT EXISTS tenant_usage_stats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    stat_month VARCHAR(7) NOT NULL COMMENT '统计月份 YYYY-MM',
    appointment_count INT DEFAULT 0 COMMENT '本月预约数',
    email_count INT DEFAULT 0 COMMENT '本月邮件发送数',
    sms_count INT DEFAULT 0 COMMENT '本月短信发送数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tenant_month (tenant_id, stat_month),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='租户使用量统计';
