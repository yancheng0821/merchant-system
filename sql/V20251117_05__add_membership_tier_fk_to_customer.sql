-- Add membership_tier_id foreign key to customer table
-- This replaces the old membership_level string field with a reference to membership_tier table

-- Step 1: Add the new membership_tier_id column (nullable initially for data migration)
ALTER TABLE customers
    ADD COLUMN membership_tier_id BIGINT DEFAULT NULL COMMENT '会员等级ID（外键）';

-- Step 2: Migrate existing membership_level data to membership_tier_id
-- This attempts to map old membership levels to new tier IDs based on code
UPDATE customers c
    LEFT JOIN membership_tier mt ON mt.code COLLATE utf8mb4_unicode_ci = c.membership_level COLLATE utf8mb4_unicode_ci
        AND mt.tenant_id = c.tenant_id
        AND mt.is_deleted = false
    SET c.membership_tier_id = mt.id
WHERE c.membership_level IS NOT NULL;

-- Step 3: For any customers without a tier, set them to the lowest tier (by required_points)
UPDATE customers c
    LEFT JOIN (
    SELECT mt1.id, mt1.tenant_id
    FROM membership_tier mt1
    INNER JOIN (
    SELECT tenant_id, MIN(required_points) as min_points
    FROM membership_tier
    WHERE is_deleted = false
    GROUP BY tenant_id
    ) mt2 ON mt1.tenant_id = mt2.tenant_id AND mt1.required_points = mt2.min_points
    WHERE mt1.is_deleted = false
    ) default_tier ON default_tier.tenant_id = c.tenant_id
    SET c.membership_tier_id = default_tier.id
WHERE c.membership_tier_id IS NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE customers
    ADD CONSTRAINT fk_customer_membership_tier
        FOREIGN KEY (membership_tier_id) REFERENCES membership_tier(id);

-- Step 5: Add index for better query performance
CREATE INDEX idx_customer_membership_tier_id ON customers(membership_tier_id);

-- Step 6: (Optional) Keep the old membership_level column for reference
-- You can uncomment the line below to drop the old column after confirming the migration works
-- ALTER TABLE customer DROP COLUMN membership_level;

-- Drop the old membership_level column from customer table
-- Now using membership_tier_id foreign key instead

-- Drop the membership_level column
ALTER TABLE customers
DROP COLUMN membership_level;
