-- Add payment_method field to order_services table
-- This field records the payment method used for each service in multi-service orders
-- For example, in a mixed payment scenario, one service might use PACKAGE while another uses CREDIT_CARD

use merchant_business;

ALTER TABLE `order_services`
ADD COLUMN `payment_method` ENUM('cash', 'credit_card', 'debit_card', 'mobile_pay', 'gift_card', 'package', 'mixed')
DEFAULT NULL
COMMENT 'Payment method for this service (NULL for backward compatibility, populated for new orders)'
AFTER `assigned_resource_type`;

-- Add index for payment_method to improve query performance
CREATE INDEX idx_payment_method ON order_services(payment_method);
