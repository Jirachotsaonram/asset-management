<?php
class AssetHistory {
    private $conn;
    private $table_name = "Asset_History";

    public $history_id;
    public $asset_id;
    public $old_location_id;
    public $new_location_id;
    public $moved_by;
    public $move_date;
    public $remark;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET asset_id=:asset_id, old_location_id=:old_location_id,
                      new_location_id=:new_location_id, moved_by=:moved_by,
                      move_date=:move_date, remark=:remark";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":asset_id", $this->asset_id);
        $stmt->bindParam(":old_location_id", $this->old_location_id);
        $stmt->bindParam(":new_location_id", $this->new_location_id);
        $stmt->bindParam(":moved_by", $this->moved_by);
        $stmt->bindParam(":move_date", $this->move_date);
        $stmt->bindParam(":remark", $this->remark);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function readByAsset() {
        $query = "SELECT ah.*, 
                         l1.building_name as old_building, l1.room_number as old_room,
                         l2.building_name as new_building, l2.room_number as new_room,
                         u.fullname as moved_by_name
                  FROM " . $this->table_name . " ah
                  LEFT JOIN Locations l1 ON ah.old_location_id = l1.location_id
                  LEFT JOIN Locations l2 ON ah.new_location_id = l2.location_id
                  LEFT JOIN Users u ON ah.moved_by = u.user_id
                  WHERE ah.asset_id = :asset_id
                  ORDER BY ah.move_date DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":asset_id", $this->asset_id);
        $stmt->execute();
        return $stmt;
    }

    public function readAll() {
        $query = "SELECT ah.*, a.asset_name,
                         l1.building_name as old_building, l1.room_number as old_room,
                         l2.building_name as new_building, l2.room_number as new_room,
                         u.fullname as moved_by_name
                  FROM " . $this->table_name . " ah
                  LEFT JOIN Assets a ON ah.asset_id = a.asset_id
                  LEFT JOIN Locations l1 ON ah.old_location_id = l1.location_id
                  LEFT JOIN Locations l2 ON ah.new_location_id = l2.location_id
                  LEFT JOIN Users u ON ah.moved_by = u.user_id
                  ORDER BY ah.move_date DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }
}
?>