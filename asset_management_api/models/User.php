<?php
class User {
    private $conn;
    private $table_name = "Users";

    public $user_id;
    public $username;
    public $password;
    public $fullname;
    public $role;
    public $status;
    public $email;
    public $phone;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function login() {
        $query = "SELECT user_id, username, password, fullname, role, status, email, phone 
                  FROM " . $this->table_name . " 
                  WHERE username = :username AND status = 'Active'";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":username", $this->username);
        $stmt->execute();
        
        return $stmt;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET username=:username, password=:password, fullname=:fullname, 
                      role=:role, email=:email, phone=:phone";
        
        $stmt = $this->conn->prepare($query);

        $this->password = password_hash($this->password, PASSWORD_BCRYPT);

        $stmt->bindParam(":username", $this->username);
        $stmt->bindParam(":password", $this->password);
        $stmt->bindParam(":fullname", $this->fullname);
        $stmt->bindParam(":role", $this->role);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":phone", $this->phone);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function readAll() {
        $query = "SELECT user_id, username, fullname, role, status, email, phone, created_at 
                  FROM " . $this->table_name . " 
                  ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }

    public function updateStatus() {
        $query = "UPDATE " . $this->table_name . " 
                  SET status = :status 
                  WHERE user_id = :user_id";
        
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":user_id", $this->user_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>
