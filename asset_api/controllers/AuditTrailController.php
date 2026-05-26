<?php
// FILE: asset_management_api/controllers/AuditTrailController.php
require_once 'config/database.php';
require_once 'models/AuditTrail.php';
require_once 'utils/Response.php';

class AuditTrailController {
    private $db;
    private $auditTrail;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->auditTrail = new AuditTrail($this->db);
    }

    // ✅ ดึงข้อมูลทั้งหมดพร้อมกรอง และรองรับ Pagination
    public function getAll() {
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        if ($page <= 0) $page = 1;
        $offset = ($page - 1) * $limit;

        $filters = [
            'action' => $_GET['action'] ?? null,
            'user_id' => $_GET['user_id'] ?? null,
            'asset_id' => $_GET['asset_id'] ?? null,
            'start_date' => $_GET['start_date'] ?? null,
            'end_date' => $_GET['end_date'] ?? null,
            'keyword' => $_GET['keyword'] ?? null
        ];

        $where = " WHERE 1=1";
        $params = [];

        // กรองตาม Action
        if (!empty($filters['action'])) {
            $where .= " AND at.action = :action";
            $params[':action'] = $filters['action'];
        }

        // กรองตามผู้ใช้
        if (!empty($filters['user_id'])) {
            $where .= " AND at.user_id = :user_id";
            $params[':user_id'] = $filters['user_id'];
        }

        // กรองตามครุภัณฑ์
        if (!empty($filters['asset_id'])) {
            $where .= " AND at.asset_id = :asset_id";
            $params[':asset_id'] = $filters['asset_id'];
        }

        // กรองตามวันที่
        if (!empty($filters['start_date'])) {
            $where .= " AND DATE(at.action_date) >= :start_date";
            $params[':start_date'] = $filters['start_date'];
        }

        if (!empty($filters['end_date'])) {
            $where .= " AND DATE(at.action_date) <= :end_date";
            $params[':end_date'] = $filters['end_date'];
        }

        // ค้นหาแบบ Keyword
        if (!empty($filters['keyword'])) {
            $where .= " AND (u.fullname LIKE :keyword 
                        OR a.asset_name LIKE :keyword 
                        OR at.action LIKE :keyword)";
            $params[':keyword'] = '%' . $filters['keyword'] . '%';
        }

        // นับจำนวนทั้งหมด
        $count_query = "SELECT COUNT(*) FROM audittrail at 
                        LEFT JOIN users u ON at.user_id = u.user_id
                        LEFT JOIN assets a ON at.asset_id = a.asset_id" . $where;
        $count_stmt = $this->db->prepare($count_query);
        foreach ($params as $key => $value) {
            $count_stmt->bindValue($key, $value);
        }
        $count_stmt->execute();
        $total = $count_stmt->fetchColumn();

        // ดึงข้อมูลรายหน้า
        $query = "SELECT at.*, u.fullname, a.asset_name
                  FROM audittrail at
                  LEFT JOIN users u ON at.user_id = u.user_id
                  LEFT JOIN assets a ON at.asset_id = a.asset_id" . 
                  $where . " ORDER BY at.action_date DESC LIMIT :limit OFFSET :offset";
        
        $stmt = $this->db->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $audits = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $audits[] = $row;
        }

        Response::success('ดึงข้อมูล Audit Trail สำเร็จ', [
            'items' => $audits,
            'total' => (int)$total,
            'page' => (int)$page,
            'limit' => (int)$limit,
            'totalPages' => ceil($total / $limit)
        ]);
    }

    public function getByAsset($asset_id) {
        $this->auditTrail->asset_id = $asset_id;
        $stmt = $this->auditTrail->readByAsset();
        $audits = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $audits[] = $row;
        }

        Response::success('ดึง Audit Trail ของครุภัณฑ์สำเร็จ', $audits);
    }

    public function getByUser($user_id) {
        $this->auditTrail->user_id = $user_id;
        $stmt = $this->auditTrail->readByUser();
        $audits = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $audits[] = $row;
        }

        Response::success('ดึง Audit Trail ของผู้ใช้สำเร็จ', $audits);
    }

    // ✅ Export เป็น CSV
    public function exportCSV() {
        $filters = [
            'action' => $_GET['action'] ?? null,
            'user_id' => $_GET['user_id'] ?? null,
            'asset_id' => $_GET['asset_id'] ?? null,
            'start_date' => $_GET['start_date'] ?? null,
            'end_date' => $_GET['end_date'] ?? null,
            'keyword' => $_GET['keyword'] ?? null
        ];

        $query = "SELECT at.*, u.fullname, a.asset_name, a.serial_number
                  FROM audittrail at
                  LEFT JOIN users u ON at.user_id = u.user_id
                  LEFT JOIN assets a ON at.asset_id = a.asset_id
                  WHERE 1=1";
        
        $params = [];

        // กรองเหมือนกับ getAll()
        if (!empty($filters['action'])) {
            $query .= " AND at.action = :action";
            $params[':action'] = $filters['action'];
        }

        if (!empty($filters['user_id'])) {
            $query .= " AND at.user_id = :user_id";
            $params[':user_id'] = $filters['user_id'];
        }

        if (!empty($filters['asset_id'])) {
            $query .= " AND at.asset_id = :asset_id";
            $params[':asset_id'] = $filters['asset_id'];
        }

        if (!empty($filters['start_date'])) {
            $query .= " AND DATE(at.action_date) >= :start_date";
            $params[':start_date'] = $filters['start_date'];
        }

        if (!empty($filters['end_date'])) {
            $query .= " AND DATE(at.action_date) <= :end_date";
            $params[':end_date'] = $filters['end_date'];
        }

        if (!empty($filters['keyword'])) {
            $query .= " AND (u.fullname LIKE :keyword 
                        OR a.asset_name LIKE :keyword 
                        OR at.action LIKE :keyword)";
            $params[':keyword'] = '%' . $filters['keyword'] . '%';
        }

        $query .= " ORDER BY at.action_date DESC";
        
        $stmt = $this->db->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();

        // ตั้งค่า Header สำหรับ CSV
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="audit_trail_' . date('Y-m-d_His') . '.csv"');
        
        $output = fopen('php://output', 'w');
        
        // เพิ่ม BOM สำหรับ UTF-8
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // Header ของ CSV
        fputcsv($output, [
            'วันที่-เวลา',
            'ผู้ใช้งาน',
            'Action',
            'รหัสครุภัณฑ์',
            'ชื่อครุภัณฑ์',
            'Serial Number',
            'ค่าเดิม (Old Value)',
            'ค่าใหม่ (New Value)'
        ]);

        // ข้อมูล
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            fputcsv($output, [
                $row['action_date'],
                $row['fullname'],
                $row['action'],
                $row['asset_id'],
                $row['asset_name'],
                $row['serial_number'],
                $row['old_value'],
                $row['new_value']
            ]);
        }

        fclose($output);
        exit;
    }

    // ✅ Export เป็น Excel (ใช้ CSV แต่บันทึกเป็น .xlsx)
    public function exportExcel() {
        // เรียกใช้ฟังก์ชันเดียวกับ CSV แต่เปลี่ยน extension
        $filters = [
            'action' => $_GET['action'] ?? null,
            'user_id' => $_GET['user_id'] ?? null,
            'asset_id' => $_GET['asset_id'] ?? null,
            'start_date' => $_GET['start_date'] ?? null,
            'end_date' => $_GET['end_date'] ?? null,
            'keyword' => $_GET['keyword'] ?? null
        ];

        $query = "SELECT at.*, u.fullname, a.asset_name, a.serial_number
                  FROM audittrail at
                  LEFT JOIN users u ON at.user_id = u.user_id
                  LEFT JOIN assets a ON at.asset_id = a.asset_id
                  WHERE 1=1";
        
        $params = [];

        if (!empty($filters['action'])) {
            $query .= " AND at.action = :action";
            $params[':action'] = $filters['action'];
        }

        if (!empty($filters['user_id'])) {
            $query .= " AND at.user_id = :user_id";
            $params[':user_id'] = $filters['user_id'];
        }

        if (!empty($filters['asset_id'])) {
            $query .= " AND at.asset_id = :asset_id";
            $params[':asset_id'] = $filters['asset_id'];
        }

        if (!empty($filters['start_date'])) {
            $query .= " AND DATE(at.action_date) >= :start_date";
            $params[':start_date'] = $filters['start_date'];
        }

        if (!empty($filters['end_date'])) {
            $query .= " AND DATE(at.action_date) <= :end_date";
            $params[':end_date'] = $filters['end_date'];
        }

        if (!empty($filters['keyword'])) {
            $query .= " AND (u.fullname LIKE :keyword 
                        OR a.asset_name LIKE :keyword 
                        OR at.action LIKE :keyword)";
            $params[':keyword'] = '%' . $filters['keyword'] . '%';
        }

        $query .= " ORDER BY at.action_date DESC";
        
        $stmt = $this->db->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();

        // ตั้งค่า Header สำหรับ Excel
        header('Content-Type: application/vnd.ms-excel; charset=utf-8');
        header('Content-Disposition: attachment; filename="audit_trail_' . date('Y-m-d_His') . '.xls"');
        
        $output = fopen('php://output', 'w');
        
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
        
        fputcsv($output, [
            'วันที่-เวลา',
            'ผู้ใช้งาน',
            'Action',
            'รหัสครุภัณฑ์',
            'ชื่อครุภัณฑ์',
            'Serial Number',
            'ค่าเดิม (Old Value)',
            'ค่าใหม่ (New Value)'
        ], "\t");

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            fputcsv($output, [
                $row['action_date'],
                $row['fullname'],
                $row['action'],
                $row['asset_id'],
                $row['asset_name'],
                $row['serial_number'],
                $row['old_value'],
                $row['new_value']
            ], "\t");
        }

        fclose($output);
        exit;
    }
}
?>