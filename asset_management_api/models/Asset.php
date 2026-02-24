<?php
class Asset {
    private $conn;
    private $table_name = "assets";

    public $asset_id;
    public $asset_name;
    public $serial_number;
    public $quantity;
    public $unit;
    public $price;
    public $received_date;
    public $department_id;
    public $location_id;
    public $status;
    public $barcode;
    public $description;
    public $reference_number;
    public $faculty_name;
    public $delivery_number;
    public $fund_code;
    public $plan_code;
    public $project_code;
    public $room_text;
    public $image;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET asset_name=:asset_name, serial_number=:serial_number, 
                      quantity=:quantity, unit=:unit, price=:price, 
                      received_date=:received_date, department_id=:department_id, 
                      location_id=:location_id, room_text=:room_text, status=:status, barcode=:barcode,
                      description=:description, reference_number=:reference_number,
                      faculty_name=:faculty_name, delivery_number=:delivery_number,
                      fund_code=:fund_code, plan_code=:plan_code, project_code=:project_code,
                      image=:image";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":asset_name", $this->asset_name);
        $stmt->bindParam(":serial_number", $this->serial_number);
        $stmt->bindParam(":quantity", $this->quantity);
        $stmt->bindParam(":unit", $this->unit);
        $stmt->bindParam(":price", $this->price);
        $stmt->bindParam(":received_date", $this->received_date);
        $stmt->bindParam(":department_id", $this->department_id);
        $stmt->bindParam(":location_id", $this->location_id);
        $stmt->bindParam(":room_text", $this->room_text);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":barcode", $this->barcode);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":reference_number", $this->reference_number);
        $stmt->bindParam(":faculty_name", $this->faculty_name);
        $stmt->bindParam(":delivery_number", $this->delivery_number);
        $stmt->bindParam(":fund_code", $this->fund_code);
        $stmt->bindParam(":plan_code", $this->plan_code);
        $stmt->bindParam(":project_code", $this->project_code);
        $stmt->bindParam(":image", $this->image);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // ==================== อ่านข้อมูลทั้งหมด (backward compatible) ====================
    public function readAll() {
        $query = "SELECT * FROM v_assets_with_check_info ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // ==================== อ่านข้อมูลแบบแบ่งหน้า (ประสิทธิภาพสูง) ====================
    public function readPaginated($page = 1, $limit = 50, $filters = [], $sort = 'created_at', $order = 'DESC') {
        // จำกัดค่า sort ที่อนุญาต เพื่อป้องกัน SQL Injection
        $allowedSorts = [
            'asset_id', 'asset_name', 'serial_number', 'status', 'price', 
            'received_date', 'created_at', 'barcode', 'quantity',
            'building_name', 'floor', 'room_number', 'department_name',
            'fund_code', 'plan_code', 'project_code', 'faculty_name'
        ];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'created_at';
        }
        $order = strtoupper($order) === 'ASC' ? 'ASC' : 'DESC';

        $offset = ($page - 1) * $limit;
        $conditions = [];
        $params = [];

        // Filter by status
        if (!empty($filters['status'])) {
            $conditions[] = "status = :status";
            $params[':status'] = $filters['status'];
        }

        // Filter by department
        if (!empty($filters['department_id'])) {
            $conditions[] = "department_id = :department_id";
            $params[':department_id'] = $filters['department_id'];
        }

        // Filter by building
        if (!empty($filters['building'])) {
            $conditions[] = "building_name = :building";
            $params[':building'] = $filters['building'];
        }

        // Filter by floor
        if (!empty($filters['floor'])) {
            $conditions[] = "floor = :floor";
            $params[':floor'] = $filters['floor'];
        }

        // Filter by room_number
        if (!empty($filters['room_number'])) {
            $conditions[] = "room_number = :room_number";
            $params[':room_number'] = $filters['room_number'];
        }

        // Filter by location_id
        if (!empty($filters['location_id'])) {
            $conditions[] = "location_id = :location_id";
            $params[':location_id'] = $filters['location_id'];
        }

        // Filter by unchecked (not checked in more than 365 days)
        if (!empty($filters['unchecked'])) {
            $conditions[] = "(last_check_date IS NULL OR DATEDIFF(NOW(), last_check_date) > :days)";
            $params[':days'] = 365;
        }

        // Search
        if (!empty($filters['search'])) {
            $conditions[] = "(asset_name LIKE :search 
                OR asset_id LIKE :search 
                OR serial_number LIKE :search 
                OR barcode LIKE :search 
                OR fund_code LIKE :search 
                OR plan_code LIKE :search 
                OR project_code LIKE :search 
                OR department_name LIKE :search 
                OR building_name LIKE :search 
                OR room_number LIKE :search 
                OR room_text LIKE :search 
                OR faculty_name LIKE :search 
                OR delivery_number LIKE :search 
                OR description LIKE :search)";
            $params[':search'] = '%' . $filters['search'] . '%';
        }

        $whereClause = '';
        if (!empty($conditions)) {
            $whereClause = 'WHERE ' . implode(' AND ', $conditions);
        }

        $query = "SELECT * FROM v_assets_with_check_info $whereClause ORDER BY $sort $order LIMIT :limit OFFSET :offset";
        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt;
    }

    // ==================== นับจำนวนรายการ ====================
    public function getCount($filters = []) {
        $conditions = [];
        $params = [];

        if (!empty($filters['status'])) {
            $conditions[] = "status = :status";
            $params[':status'] = $filters['status'];
        }
        if (!empty($filters['department_id'])) {
            $conditions[] = "department_id = :department_id";
            $params[':department_id'] = $filters['department_id'];
        }
        if (!empty($filters['building'])) {
            $conditions[] = "building_name = :building";
            $params[':building'] = $filters['building'];
        }
        if (!empty($filters['floor'])) {
            $conditions[] = "floor = :floor";
            $params[':floor'] = $filters['floor'];
        }
        if (!empty($filters['location_id'])) {
            $conditions[] = "location_id = :location_id";
            $params[':location_id'] = $filters['location_id'];
        }
        if (!empty($filters['unchecked'])) {
            $conditions[] = "(last_check_date IS NULL OR DATEDIFF(NOW(), last_check_date) > :days)";
            $params[':days'] = 365;
        }
        if (!empty($filters['search'])) {
            $conditions[] = "(asset_name LIKE :search 
                OR asset_id LIKE :search 
                OR serial_number LIKE :search 
                OR barcode LIKE :search 
                OR fund_code LIKE :search 
                OR plan_code LIKE :search 
                OR project_code LIKE :search 
                OR department_name LIKE :search 
                OR building_name LIKE :search 
                OR room_number LIKE :search 
                OR room_text LIKE :search 
                OR faculty_name LIKE :search 
                OR delivery_number LIKE :search 
                OR description LIKE :search)";
            $params[':search'] = '%' . $filters['search'] . '%';
        }

        $whereClause = '';
        if (!empty($conditions)) {
            $whereClause = 'WHERE ' . implode(' AND ', $conditions);
        }

        $query = "SELECT COUNT(*) as total FROM v_assets_with_check_info $whereClause";
        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return (int)$row['total'];
    }

    public function readOne() {
        $query = "SELECT * FROM v_assets_with_check_info 
                  WHERE asset_id = :asset_id OR barcode = :barcode";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":asset_id", $this->asset_id);
        $stmt->bindParam(":barcode", $this->barcode);
        $stmt->execute();
        return $stmt;
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET asset_name=:asset_name, serial_number=:serial_number, 
                      quantity=:quantity, unit=:unit, price=:price, 
                      department_id=:department_id, location_id=:location_id, room_text=:room_text,
                      status=:status, description=:description,
                      reference_number=:reference_number,
                      faculty_name=:faculty_name, delivery_number=:delivery_number,
                      fund_code=:fund_code, plan_code=:plan_code, project_code=:project_code,
                      image=:image
                  WHERE asset_id = :asset_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":asset_name", $this->asset_name);
        $stmt->bindParam(":serial_number", $this->serial_number);
        $stmt->bindParam(":quantity", $this->quantity);
        $stmt->bindParam(":unit", $this->unit);
        $stmt->bindParam(":price", $this->price);
        $stmt->bindParam(":department_id", $this->department_id);
        $stmt->bindParam(":location_id", $this->location_id);
        $stmt->bindParam(":room_text", $this->room_text);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":reference_number", $this->reference_number);
        $stmt->bindParam(":faculty_name", $this->faculty_name);
        $stmt->bindParam(":delivery_number", $this->delivery_number);
        $stmt->bindParam(":fund_code", $this->fund_code);
        $stmt->bindParam(":plan_code", $this->plan_code);
        $stmt->bindParam(":project_code", $this->project_code);
        $stmt->bindParam(":image", $this->image);
        $stmt->bindParam(":asset_id", $this->asset_id);

        return $stmt->execute();
    }

    public function search($keyword) {
        $query = "SELECT * FROM v_assets_with_check_info
                  WHERE asset_name LIKE :keyword 
                     OR serial_number LIKE :keyword 
                     OR barcode LIKE :keyword
                     OR fund_code LIKE :keyword
                     OR plan_code LIKE :keyword
                     OR project_code LIKE :keyword
                  ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $keyword = "%{$keyword}%";
        $stmt->bindParam(":keyword", $keyword);
        $stmt->execute();
        return $stmt;
    }
}