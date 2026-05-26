<?php
require_once 'config/database.php';
require_once 'models/SystemSetting.php';
require_once 'utils/Response.php';

class SystemSettingController {
    private $db;
    private $systemSetting;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->systemSetting = new SystemSetting($this->db);
    }

    public function getAll() {
        $stmt = $this->systemSetting->getAll();
        $settings = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
        Response::success('ดึงข้อมูลตั้งค่าสำเร็จ', $settings);
    }

    public function update() {
        $data = json_decode(file_get_contents("php://input"));
        if (!empty($data)) {
            foreach ($data as $key => $value) {
                $this->systemSetting->update($key, $value);
            }
            Response::success('บันทึกการตั้งค่าสำเร็จ');
        } else {
            Response::error('ไม่มีข้อมูลที่ต้องการบันทึก', 400);
        }
    }
}
?>
