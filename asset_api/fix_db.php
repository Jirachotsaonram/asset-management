<?php
require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // เปลี่ยนชนิดคอลัมน์จาก ENUM ที่อาจมีปัญหาภาษาไทย เป็น VARCHAR(50)
    $queries = [
        "ALTER TABLE asset_check MODIFY check_status VARCHAR(50) NOT NULL",
        "ALTER TABLE borrow MODIFY status VARCHAR(50) NOT NULL DEFAULT 'ยืม'"
    ];

    foreach ($queries as $query) {
        $db->exec($query);
    }
    
    echo "<h1>แก้ไขฐานข้อมูลสำเร็จ!</h1>";
    echo "<p>เปลี่ยนคอลัมน์ check_status (ตาราง asset_check) และ status (ตาราง borrow) เป็น VARCHAR(50) เรียบร้อยแล้ว เพื่อแก้ปัญหาตัวอักษรภาษาไทยใน ENUM</p>";
} catch (PDOException $e) {
    echo "<h1>เกิดข้อผิดพลาด:</h1>";
    echo "<p>" . $e->getMessage() . "</p>";
}
?>
