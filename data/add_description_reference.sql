-- Migration: Add description and reference_number to Assets table
-- Run this in phpMyAdmin or MySQL CLI

ALTER TABLE assets
  ADD COLUMN description TEXT NULL AFTER barcode,
  ADD COLUMN reference_number VARCHAR(50) NULL AFTER description;

-- Update the view to include new columns (recreate it)
-- First check if view exists, then recreate
DROP VIEW IF EXISTS v_assets_with_check_info;

CREATE VIEW v_assets_with_check_info AS
SELECT 
    a.*,
    d.department_name,
    d.faculty,
    l.building_name,
    l.floor,
    l.room_number,
    ac.last_check_date,
    ac.last_check_status,
    ac.check_count
FROM assets a
LEFT JOIN departments d ON a.department_id = d.department_id
LEFT JOIN locations l ON a.location_id = l.location_id
LEFT JOIN (
    SELECT 
        asset_id,
        MAX(check_date) as last_check_date,
        (SELECT check_status FROM asset_checks ac2 
         WHERE ac2.asset_id = asset_checks.asset_id 
         ORDER BY check_date DESC LIMIT 1) as last_check_status,
        COUNT(*) as check_count
    FROM asset_checks
    GROUP BY asset_id
) ac ON a.asset_id = ac.asset_id;
