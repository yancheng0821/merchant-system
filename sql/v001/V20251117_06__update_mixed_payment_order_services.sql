-- Update order_services payment_method for mixed payment orders
-- For mixed payment orders, set payment_method to 'cash' for order_services that don't have a payment_method set

UPDATE order_services os
JOIN orders o ON os.order_id = o.id
SET os.payment_method = 'cash'
WHERE o.payment_method = 'mixed'
  AND (os.payment_method IS NULL OR os.payment_method = '');

-- Display summary of changes
SELECT
    'Summary: Updated order_services records' as action,
    COUNT(*) as updated_count
FROM order_services os
JOIN orders o ON os.order_id = o.id
WHERE o.payment_method = 'mixed'
  AND os.payment_method = 'cash';
