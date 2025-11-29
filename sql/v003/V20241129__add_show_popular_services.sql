-- Add show_popular_services column to online_booking_config table
-- This allows merchants to control whether to display "Popular" tags on services
-- Popular services are determined by the top 15% of services by booking count (min 1, max 5)

ALTER TABLE online_booking_config
ADD COLUMN show_popular_services TINYINT(1) DEFAULT 1 COMMENT 'Whether to display popular service tags on booking page';
