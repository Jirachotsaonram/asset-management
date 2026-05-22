<?php
// FILE: asset_management_api/models/User.php
class User {
    private $conn;
    private $table_name = "users";

    public $user_id;
    public $fullname;
    public $role;
    public $status;
    public $email;
    public $phone;
    public $google_sub_id;
    public $avatar_url;
    public $auth_provider = 'local';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET fullname=:fullname, 
                      role=:role, status=:status, email=:email, phone=:phone,
                      google_sub_id=:google_sub_id, avatar_url=:avatar_url, auth_provider=:auth_provider";
        
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":fullname", $this->fullname);
        $stmt->bindParam(":role", $this->role);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":google_sub_id", $this->google_sub_id);
        $stmt->bindParam(":avatar_url", $this->avatar_url);
        $stmt->bindParam(":auth_provider", $this->auth_provider);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function readAll() {
        $query = "SELECT user_id, fullname, avatar_url, role, status, email, phone, created_at 
                  FROM " . $this->table_name . " 
                  ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }

    public function readOne() {
        $query = "SELECT user_id, fullname, avatar_url, role, status, email, phone, created_at 
                  FROM " . $this->table_name . " 
                  WHERE user_id = :user_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->execute();
        
        return $stmt;
    }

    // ✅ Update โดยไม่เปลี่ยนรหัสผ่าน
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET fullname = :fullname, 
                      role = :role, 
                      status = :status, 
                      email = :email, 
                      phone = :phone
                  WHERE user_id = :user_id";
        
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":fullname", $this->fullname);
        $stmt->bindParam(":role", $this->role);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":user_id", $this->user_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
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

    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " 
                  WHERE user_id = :user_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $this->user_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function findByEmail($email) {
        $query = "SELECT user_id, fullname, role, status, email, phone, google_sub_id, avatar_url, auth_provider 
                  FROM " . $this->table_name . " 
                  WHERE email = :email LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();
        
        return $stmt;
    }

    public function findByGoogleSubId($sub) {
        $query = "SELECT user_id, fullname, role, status, email, phone, google_sub_id, avatar_url, auth_provider 
                  FROM " . $this->table_name . " 
                  WHERE google_sub_id = :google_sub_id LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":google_sub_id", $sub);
        $stmt->execute();
        
        return $stmt;
    }

    public function updateGoogleInfo() {
        $query = "UPDATE " . $this->table_name . " 
                  SET google_sub_id = :google_sub_id, 
                      avatar_url = :avatar_url, 
                      auth_provider = 'google'
                  WHERE user_id = :user_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":google_sub_id", $this->google_sub_id);
        $stmt->bindParam(":avatar_url", $this->avatar_url);
        $stmt->bindParam(":user_id", $this->user_id);
        
        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>