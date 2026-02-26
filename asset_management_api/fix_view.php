<?php
require_once 'config/database.php';
require_once 'utils/Response.php';

$database = new Database();
$db = $database->getConnection();

try {
    // 1. Drop existing view
    $db->exec("DROP VIEW IF EXISTS v_assets_with_check_info");

    // 2. Create optimized view based on optimize_view.sql
    $query = "CREATE VIEW `v_assets_with_check_info` AS 
    SELECT 
        a.*, 
        d.department_name, 
        l.building_name, 
        l.floor, 
        l.room_number,
        ac_latest.check_date AS last_check_date,
        u_latest.fullname AS last_checker,
        ac_latest.check_status AS last_check_status,
        sch.next_check_date AS next_check_date,
        sch.schedule_id AS schedule_id,
        cs.name AS schedule_name,
        cs.check_interval_months AS check_interval_months,
        CASE 
            WHEN sch.next_check_date IS NULL THEN 'no_schedule' 
            WHEN DATEDIFF(sch.next_check_date, CURDATE()) < 0 THEN 'overdue' 
            WHEN DATEDIFF(sch.next_check_date, CURDATE()) = 0 THEN 'today' 
            WHEN DATEDIFF(sch.next_check_date, CURDATE()) <= 7 THEN 'urgent' 
            ELSE 'normal' 
        END AS check_urgency,
        DATEDIFF(sch.next_check_date, CURDATE()) AS days_until_check
    FROM `assets` a
    LEFT JOIN `departments` d ON a.department_id = d.department_id
    LEFT JOIN `locations` l ON a.location_id = l.location_id
    LEFT JOIN `asset_schedules` sch ON a.asset_id = sch.asset_id
    LEFT JOIN `check_schedules` cs ON sch.schedule_id = cs.schedule_id
    LEFT JOIN (
        -- Subquery to find the latest check ID for each asset
        SELECT asset_id, MAX(check_id) as latest_check_id
        FROM asset_check
        GROUP BY asset_id
    ) latest_ids ON a.asset_id = latest_ids.asset_id
    LEFT JOIN asset_check ac_latest ON latest_ids.latest_check_id = ac_latest.check_id
    LEFT JOIN users u_latest ON ac_latest.user_id = u_latest.user_id";

    $db->exec($query);

    Response::success('Recreated v_assets_with_check_info with optimization successfully');
} catch (Exception $e) {
    Response::error('Failed to recreate view: ' . $e->getMessage(), 500);
}
?>
