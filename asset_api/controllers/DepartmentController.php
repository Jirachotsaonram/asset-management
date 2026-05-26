<?php
require_once 'config/database.php';
require_once 'models/Department.php';
require_once 'utils/Response.php';

class DepartmentController {
    private $db;
    private $department;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        
        if (!$this->db) {
            error_log("DepartmentController: Database connection failed.");
        }
        
        $this->department = new Department($this->db);
    }

    public function getAll() {
        if (!$this->db) {
            Response::error('ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 503);
            return;
        }
        $stmt = $this->department->readAll();
        $departments = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $departments[] = $row;
        }

        Response::success('ดึงข้อมูลหน่วยงานสำเร็จ', $departments);
    }

    public function getOne($id) {
        $this->department->department_id = $id;
        $stmt = $this->department->readOne();
        
        if ($stmt->rowCount() > 0) {
            $dept = $stmt->fetch(PDO::FETCH_ASSOC);
            Response::success('ดึงข้อมูลหน่วยงานสำเร็จ', $dept);
        } else {
            Response::error('ไม่พบข้อมูลหน่วยงาน', 404);
        }
    }

    public function create() {
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->faculty)) {
            $this->department->faculty = $data->faculty;
        } elseif (!empty($data->department_name)) {
            // Fallback for older frontend before migration
            $this->department->faculty = $data->department_name;
        } else {
            Response::error('กรุณาระบุคณะ (faculty)', 400);
            return;
        }
        
        $this->department->division_name = $data->division_name ?? null;

        $id = $this->department->create();
        
        if ($id) {
            Response::success('เพิ่มหน่วยงานสำเร็จ', ['department_id' => $id]);
        } else {
            Response::error('ไม่สามารถเพิ่มหน่วยงานได้', 500);
        }
    }

    public function update($id) {
        $data = json_decode(file_get_contents("php://input"));

        $this->department->department_id = $id;
        
        if (!empty($data->faculty)) {
            $this->department->faculty = $data->faculty;
        } elseif (!empty($data->department_name)) {
            $this->department->faculty = $data->department_name;
        }
        
        $this->department->division_name = $data->division_name ?? null;

        if ($this->department->update()) {
            Response::success('อัปเดตหน่วยงานสำเร็จ');
        } else {
            Response::error('ไม่สามารถอัปเดตหน่วยงานได้', 500);
        }
    }

    public function delete($id) {
        $this->department->department_id = $id;

        if ($this->department->delete()) {
            Response::success('ลบหน่วยงานสำเร็จ');
        } else {
            Response::error('ไม่สามารถลบหน่วยงานได้', 500);
        }
    }
}
?>