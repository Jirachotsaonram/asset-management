<?php
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

    public function getAll() {
        $stmt = $this->auditTrail->readAll();
        $audits = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $audits[] = $row;
        }

        Response::success('ดึงข้อมูล Audit Trail สำเร็จ', $audits);
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
}
?>