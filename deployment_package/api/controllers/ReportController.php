<?php
require_once 'config/database.php';
require_once 'utils/Response.php';

class ReportController {
    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    // รายงานสรุปครุภัณฑ์ทั้งหมด (Optimized)
    public function assetSummary() {
        $query = "SELECT * FROM v_assets_with_check_info ORDER BY asset_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $assets = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success('ดึงข้อมูลสำเร็จ', $assets);
    }

    // รายงานการตรวจสอบครุภัณฑ์ตามช่วงเวลา
    public function checkReport($params) {
        $startDate = $params['start_date'] ?? null;
        $endDate = $params['end_date'] ?? null;
        
        $query = "SELECT 
                    ac.check_id,
                    ac.check_date,
                    a.asset_id,
                    a.asset_name,
                    a.serial_number,
                    ac.check_status,
                    ac.remark,
                    u.fullname as checker_name,
                    d.department_name,
                    CONCAT(l.building_name, ' ห้อง ', l.room_number) as location
                FROM asset_check ac
                JOIN assets a ON ac.asset_id = a.asset_id
                JOIN users u ON ac.user_id = u.user_id
                LEFT JOIN departments d ON a.department_id = d.department_id
                LEFT JOIN locations l ON a.location_id = l.location_id
                WHERE 1=1";
        
        if ($startDate) {
            $query .= " AND ac.check_date >= :start_date";
        }
        if ($endDate) {
            $query .= " AND ac.check_date <= :end_date";
        }
        
        $query .= " ORDER BY ac.check_date DESC";
        
        $stmt = $this->conn->prepare($query);
        
        if ($startDate) $stmt->bindParam(':start_date', $startDate);
        if ($endDate) $stmt->bindParam(':end_date', $endDate);
        
        $stmt->execute();
        
        $checks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success('ดึงข้อมูลสำเร็จ', $checks);
    }

    // รายงานครุภัณฑ์ตามสถานะ
    public function assetByStatus() {
        $query = "SELECT 
                    status,
                    COUNT(*) as count,
                    SUM(price * quantity) as total_value
                FROM assets
                GROUP BY status
                ORDER BY count DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $summary = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success('ดึงข้อมูลสำเร็จ', $summary);
    }

    // รายงานครุภัณฑ์ตามหน่วยงาน
    public function assetByDepartment() {
        $query = "SELECT 
                    d.department_name,
                    d.faculty,
                    COUNT(a.asset_id) as asset_count,
                    SUM(a.price * a.quantity) as total_value,
                    SUM(CASE WHEN a.status = 'ใช้งานได้' THEN 1 ELSE 0 END) as active_count,
                    SUM(CASE WHEN a.status = 'รอซ่อม' THEN 1 ELSE 0 END) as repair_count,
                    SUM(CASE WHEN a.status = 'ไม่พบ' THEN 1 ELSE 0 END) as missing_count
                FROM departments d
                LEFT JOIN assets a ON d.department_id = a.department_id
                GROUP BY d.department_id
                ORDER BY asset_count DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $summary = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success('ดึงข้อมูลสำเร็จ', $summary);
    }

    // รายงานครุภัณฑ์ที่ยังไม่ได้ตรวจสอบ พร้อมระบบแบ่งหนา ค้นหา และฟิลเตอร์
    public function uncheckedAssets($params) {
        $days = $params['days'] ?? 365;
        $page = $params['page'] ?? 1;
        $limit = $params['limit'] ?? 50;
        $search = $params['search'] ?? null;
        $building = $params['building'] ?? null;
        $floor = $params['floor'] ?? null;
        $department_id = $params['department_id'] ?? null;
        $status = $params['status'] ?? null; // never | overdue | nearly | checked | all
        
        $offset = ($page - 1) * $limit;
        
        // Base condition — ถ้ากรองตามสถานะให้ใช้ condition นั้น แทน days ทั่วไป
        if ($status === 'never') {
            $conditions = ["ac.check_date IS NULL"];
            $queryParams = [];
        } elseif ($status === 'overdue') {
            $conditions = ["ac.check_date IS NOT NULL AND DATEDIFF(NOW(), ac.check_date) > 365"];
            $queryParams = [];
        } elseif ($status === 'nearly') {
            $conditions = ["ac.check_date IS NOT NULL AND DATEDIFF(NOW(), ac.check_date) BETWEEN 181 AND 365"];
            $queryParams = [];
        } elseif ($status === 'checked') {
            $conditions = ["ac.check_date IS NOT NULL AND DATEDIFF(NOW(), ac.check_date) <= 180"];
            $queryParams = [];
        } else {
            // default: ยังไม่เคยตรวจ หรือ เกินกำหนด days
            $conditions = ["(ac.check_date IS NULL OR DATEDIFF(NOW(), ac.check_date) > :days)"];
            $queryParams = [':days' => $days];
        }
        
        if ($search) {
            $conditions[] = "(a.asset_name LIKE :search OR a.asset_id LIKE :search OR a.serial_number LIKE :search)";
            $queryParams[':search'] = "%$search%";
        }
        
        if ($building) {
            if ($building === 'unspecified' || $building === 'ไม่ระบุอาคาร') {
                $conditions[] = "(l.building_name IS NULL OR l.building_name = '')";
            } else {
                $conditions[] = "l.building_name = :building";
                $queryParams[':building'] = $building;
            }
        }
        
        if ($floor) {
            if ($floor === 'unspecified' || $floor === 'ไม่ระบุชั้น') {
                $conditions[] = "(l.floor IS NULL OR l.floor = '')";
            } else {
                $conditions[] = "l.floor = :floor";
                $queryParams[':floor'] = $floor;
            }
        }
        
        if ($department_id) {
            if ($department_id === 'unspecified') {
                $conditions[] = "a.department_id IS NULL";
            } else {
                $conditions[] = "a.department_id = :department_id";
                $queryParams[':department_id'] = $department_id;
            }
        }
        
        $whereClause = "WHERE " . implode(" AND ", $conditions);

        // นับจำนวนทั้งหมดก่อน
        $countQuery = "SELECT COUNT(*) as total
                       FROM assets a
                       LEFT JOIN locations l ON a.location_id = l.location_id
                       LEFT JOIN (
                           SELECT asset_id, MAX(check_date) as check_date
                           FROM asset_check
                           GROUP BY asset_id
                       ) ac ON a.asset_id = ac.asset_id
                       $whereClause";
        
        $countStmt = $this->conn->prepare($countQuery);
        foreach ($queryParams as $key => $val) {
            $countStmt->bindValue($key, $val);
        }
        $countStmt->execute();
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        // ดึงข้อมูลรายหน้า
        $query = "SELECT 
                    a.asset_id,
                    a.asset_name,
                    a.serial_number,
                    a.status,
                    d.department_name,
                    CONCAT(l.building_name, ' ห้อง ', l.room_number) as location,
                    ac.check_date as last_check_date,
                    DATEDIFF(NOW(), ac.check_date) as days_since_check,
                    l.building_name,
                    l.room_number,
                    l.floor
                FROM assets a
                LEFT JOIN departments d ON a.department_id = d.department_id
                LEFT JOIN locations l ON a.location_id = l.location_id
                LEFT JOIN (
                    SELECT asset_id, MAX(check_date) as check_date
                    FROM asset_check
                    GROUP BY asset_id
                ) ac ON a.asset_id = ac.asset_id
                $whereClause
                ORDER BY days_since_check DESC, a.asset_id ASC
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        foreach ($queryParams as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $assets = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::success('ดึงข้อมูลสำเร็จ', [
            'items' => $assets,
            'total' => (int)$total,
            'page' => (int)$page,
            'limit' => (int)$limit
        ]);
    }

    // รายงานประวัติการเคลื่อนย้าย
    public function movementHistory($params) {
        $startDate = $params['start_date'] ?? null;
        $endDate = $params['end_date'] ?? null;
        
        $query = "SELECT 
                    ah.history_id,
                    ah.move_date,
                    a.asset_id,
                    a.asset_name,
                    a.serial_number,
                    CONCAT(l1.building_name, ' ชั้น ', IFNULL(l1.floor, '-'), ' ห้อง ', l1.room_number) as old_location,
                    CONCAT(l2.building_name, ' ชั้น ', IFNULL(l2.floor, '-'), ' ห้อง ', l2.room_number) as new_location,
                    u.fullname as moved_by_name,
                    ah.remark
                FROM asset_history ah
                JOIN assets a ON ah.asset_id = a.asset_id
                LEFT JOIN locations l1 ON ah.old_location_id = l1.location_id
                LEFT JOIN locations l2 ON ah.new_location_id = l2.location_id
                LEFT JOIN users u ON ah.moved_by = u.user_id
                WHERE 1=1";
        
        if ($startDate) {
            $query .= " AND ah.move_date >= :start_date";
        }
        if ($endDate) {
            $query .= " AND ah.move_date <= :end_date";
        }
        
        $query .= " ORDER BY ah.move_date DESC";
        
        $stmt = $this->conn->prepare($query);
        
        if ($startDate) $stmt->bindParam(':start_date', $startDate);
        if ($endDate) $stmt->bindParam(':end_date', $endDate);
        
        $stmt->execute();
        
        $movements = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success('ดึงข้อมูลสำเร็จ', $movements);
    }

    // รายงานการยืมครุภัณฑ์
    public function borrowReport($status = null) {
        $query = "SELECT 
                    b.borrow_id,
                    b.borrow_date,
                    b.return_date,
                    b.status,
                    a.asset_id,
                    a.asset_name,
                    a.serial_number,
                    b.borrower_name,
                    d.department_name as borrower_department,
                    DATEDIFF(
                        CASE 
                            WHEN b.status = 'คืนแล้ว' THEN b.return_date 
                            ELSE NOW() 
                        END, 
                        b.borrow_date
                    ) as borrow_duration
                FROM borrow b
                JOIN assets a ON b.asset_id = a.asset_id
                LEFT JOIN departments d ON b.department_id = d.department_id
                WHERE 1=1";
        
        if ($status) {
            $query .= " AND b.status = :status";
        }
        
        $query .= " ORDER BY b.borrow_date DESC";
        
        $stmt = $this->conn->prepare($query);
        
        if ($status) {
            $stmt->bindParam(':status', $status);
        }
        
        $stmt->execute();
        
        $borrows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success('ดึงข้อมูลสำเร็จ', $borrows);
    }

    // Export รายงานเป็น CSV
    public function exportCSV($reportType, $params = []) {
        // ตั้งค่า header สำหรับ download CSV
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="report_' . $reportType . '_' . date('Y-m-d') . '.csv"');
        
        $output = fopen('php://output', 'w');
        
        // เพิ่ม BOM สำหรับ UTF-8
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
        
        switch ($reportType) {
            case 'asset_summary':
                fputcsv($output, ['รหัสครุภัณฑ์', 'ชื่อครุภัณฑ์', 'Serial Number', 'จำนวน', 'หน่วย', 'ราคา', 'วันที่รับ', 'สถานะ', 'หน่วยงาน', 'อาคาร', 'ชั้น', 'ห้อง', 'วันที่ตรวจล่าสุด', 'ผู้ตรวจล่าสุด']);
                
                $query = "SELECT 
                            asset_id, asset_name, serial_number, quantity, unit, price, received_date, 
                            status, department_name, building_name, floor, room_number, 
                            last_check_date, last_checker
                        FROM v_assets_with_check_info
                        ORDER BY asset_id";
                break;
                
            case 'check_report':
                fputcsv($output, ['รหัสการตรวจ', 'วันที่ตรวจ', 'รหัสครุภัณฑ์', 'ชื่อครุภัณฑ์', 'Serial Number', 'สถานะการตรวจ', 'หมายเหตุ', 'ผู้ตรวจ', 'หน่วยงาน', 'สถานที่']);
                
                $startDate = $params['start_date'] ?? null;
                $endDate = $params['end_date'] ?? null;
                
                $query = "SELECT 
                            ac.check_id,
                            ac.check_date,
                            a.asset_id,
                            a.asset_name,
                            a.serial_number,
                            ac.check_status,
                            ac.remark,
                            u.fullname as checker_name,
                            d.department_name,
                            CONCAT(l.building_name, ' ห้อง ', l.room_number) as location
                        FROM asset_check ac
                        JOIN assets a ON ac.asset_id = a.asset_id
                        JOIN users u ON ac.user_id = u.user_id
                        LEFT JOIN departments d ON a.department_id = d.department_id
                        LEFT JOIN locations l ON a.location_id = l.location_id
                        WHERE 1=1";
                
                if ($startDate) {
                    $query .= " AND ac.check_date >= :start_date";
                }
                if ($endDate) {
                    $query .= " AND ac.check_date <= :end_date";
                }
                
                $query .= " ORDER BY ac.check_date DESC";
                break;
                
            default:
                fputcsv($output, ['Error: Unknown report type']);
                fclose($output);
                exit;
        }
        
        $stmt = $this->conn->prepare($query);
        
        if (isset($startDate)) $stmt->bindParam(':start_date', $startDate);
        if (isset($endDate)) $stmt->bindParam(':end_date', $endDate);
        
        $stmt->execute();
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            fputcsv($output, $row);
        }
        
        fclose($output);
        exit;
    }

    // Export รายงานเป็น Excel (ใช้รูปแบบ Tab-delimited ที่ Excel อ่านได้)
    public function exportExcel($reportType, $params = []) {
        // ตั้งค่า header สำหรับ download Excel
        header('Content-Type: application/vnd.ms-excel; charset=utf-8');
        header('Content-Disposition: attachment; filename="report_' . $reportType . '_' . date('Y-m-d_His') . '.xls"');
        
        $output = fopen('php://output', 'w');
        
        // เพิ่ม BOM สำหรับ UTF-8
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
        
        switch ($reportType) {
            case 'asset_summary':
                fputcsv($output, ['รหัสครุภัณฑ์', 'ชื่อครุภัณฑ์', 'Serial Number', 'จำนวน', 'หน่วย', 'ราคา', 'วันที่รับ', 'สถานะ', 'หน่วยงาน', 'อาคาร', 'ชั้น', 'ห้อง', 'วันที่ตรวจล่าสุด', 'ผู้ตรวจล่าสุด'], "\t");
                
                $query = "SELECT 
                            asset_id, asset_name, serial_number, quantity, unit, price, received_date, 
                            status, department_name, building_name, floor, room_number, 
                            last_check_date, last_checker
                        FROM v_assets_with_check_info
                        ORDER BY asset_id";
                break;
                
            case 'check_report':
                fputcsv($output, ['รหัสการตรวจ', 'วันที่ตรวจ', 'รหัสครุภัณฑ์', 'ชื่อครุภัณฑ์', 'Serial Number', 'สถานะการตรวจ', 'หมายเหตุ', 'ผู้ตรวจ', 'หน่วยงาน', 'สถานที่'], "\t");
                
                $startDate = $params['start_date'] ?? null;
                $endDate = $params['end_date'] ?? null;
                
                $query = "SELECT 
                            ac.check_id,
                            ac.check_date,
                            a.asset_id,
                            a.asset_name,
                            a.serial_number,
                            ac.check_status,
                            ac.remark,
                            u.fullname as checker_name,
                            d.department_name,
                            CONCAT(l.building_name, ' ห้อง ', l.room_number) as location
                        FROM asset_check ac
                        JOIN assets a ON ac.asset_id = a.asset_id
                        JOIN users u ON ac.user_id = u.user_id
                        LEFT JOIN departments d ON a.department_id = d.department_id
                        LEFT JOIN locations l ON a.location_id = l.location_id
                        WHERE 1=1";
                
                if ($startDate) {
                    $query .= " AND ac.check_date >= :start_date";
                }
                if ($endDate) {
                    $query .= " AND ac.check_date <= :end_date";
                }
                
                $query .= " ORDER BY ac.check_date DESC";
                break;
                
            default:
                fputcsv($output, ['Error: Unknown report type'], "\t");
                fclose($output);
                exit;
        }
        
        $stmt = $this->conn->prepare($query);
        
        if (isset($startDate)) $stmt->bindParam(':start_date', $startDate);
        if (isset($endDate)) $stmt->bindParam(':end_date', $endDate);
        
        $stmt->execute();
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            fputcsv($output, $row, "\t");
        }
        
        fclose($output);
        exit;
    }
}
?>