-- Add soft delete fields to membership_tier table
-- is_deleted: flag to mark deleted records
-- deleted_at: timestamp when the record was deleted
use merchant_business;

ALTER TABLE membership_tier
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE NOT NULL COMMENT '是否已删除',
ADD COLUMN deleted_at DATETIME DEFAULT NULL COMMENT '删除时间';

-- Add index on is_deleted for better query performance
CREATE INDEX idx_membership_tier_is_deleted ON membership_tier(is_deleted);
