<?php
class Borrow {
    private $conn;
    private $table_name = "borrow";

    public $borrow_id;
    public $asset_id;
    public $borrower_name;
    public $department_id;
    public $borrow_date;
    public $return_date;
    public $due_date;
    public $status;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET asset_id=:asset_id, borrower_name=:borrower_name,
                      department_id=:department_id, borrow_date=:borrow_date,
                      return_date=:return_date, due_date=:due_date, status=:status";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":asset_id", $this->asset_id);
        $stmt->bindParam(":borrower_name", $this->borrower_name);
        $stmt->bindParam(":department_id", $this->department_id);
        $stmt->bindParam(":borrow_date", $this->borrow_date);
        $stmt->bindParam(":return_date", $this->return_date);
        $stmt->bindParam(":due_date", $this->due_date);
        $stmt->bindParam(":status", $this->status);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function readAll() {
        $query = "SELECT b.*, a.asset_name, d.department_name
                  FROM " . $this->table_name . " b
                  LEFT JOIN assets a ON b.asset_id = a.asset_id
                  LEFT JOIN departments d ON b.department_id = d.department_id
                  ORDER BY b.borrow_date DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function readByAsset() {
        $query = "SELECT b.*, d.department_name
                  FROM " . $this->table_name . " b
                  LEFT JOIN departments d ON b.department_id = d.department_id
                  WHERE b.asset_id = :asset_id
                  ORDER BY b.borrow_date DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":asset_id", $this->asset_id);
        $stmt->execute();
        return $stmt;
    }

    public function readActive() {
        $query = "SELECT b.*, a.asset_name, d.department_name
                  FROM " . $this->table_name . " b
                  LEFT JOIN assets a ON b.asset_id = a.asset_id
                  LEFT JOIN departments d ON b.department_id = d.department_id
                  WHERE b.status = 'ยืม'
                  ORDER BY b.borrow_date DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function readOne() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE borrow_id = :borrow_id LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":borrow_id", $this->borrow_id);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            $this->asset_id = $row['asset_id'];
            $this->borrower_name = $row['borrower_name'];
            $this->department_id = $row['department_id'];
            $this->borrow_date = $row['borrow_date'];
            $this->return_date = $row['return_date'];
            $this->due_date = $row['due_date'];
            $this->status = $row['status'];
            return true;
        }
        return false;
    }

    public function updateStatus() {
        $query = "UPDATE " . $this->table_name . " 
                  SET status=:status, return_date=:return_date
                  WHERE borrow_id = :borrow_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":return_date", $this->return_date);
        $stmt->bindParam(":borrow_id", $this->borrow_id);

        return $stmt->execute();
    }

    public function readPaginated($page = 1, $limit = 20, $search = null, $status = null) {
        $offset = ($page - 1) * $limit;
        
        $conditions = [];
        $params = [];
        
        if ($search) {
            $conditions[] = "(a.asset_name LIKE :search OR b.borrower_name LIKE :search OR b.asset_id LIKE :search)";
            $params[':search'] = "%$search%";
        }
        
        if ($status && $status !== 'all') {
            $conditions[] = "b.status = :status";
            $params[':status'] = $status;
        }
        
        $where = !empty($conditions) ? "WHERE " . implode(" AND ", $conditions) : "";
        
        $query = "SELECT b.*, a.asset_name, d.department_name
                  FROM " . $this->table_name . " b
                  LEFT JOIN assets a ON b.asset_id = a.asset_id
                  LEFT JOIN departments d ON b.department_id = d.department_id
                  $where
                  ORDER BY b.borrow_date DESC
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt;
    }

    public function getCount($search = null, $status = null) {
        $conditions = [];
        $params = [];
        
        if ($search) {
            $conditions[] = "(a.asset_name LIKE :search OR b.borrower_name LIKE :search OR b.asset_id LIKE :search)";
            $params[':search'] = "%$search%";
        }
        
        if ($status && $status !== 'all') {
            $conditions[] = "b.status = :status";
            $params[':status'] = $status;
        }
        
        $where = !empty($conditions) ? "WHERE " . implode(" AND ", $conditions) : "";
        
        $query = "SELECT COUNT(*) as total 
                  FROM " . $this->table_name . " b
                  LEFT JOIN assets a ON b.asset_id = a.asset_id
                  $where";
        
        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }
}
?>