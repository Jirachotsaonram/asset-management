<?php
require_once 'config/database.php';

$database = new Database();
$conn = $database->getConnection();

// สร้างรหัสผ่าน hash ใหม่
$password = 'admin123';
$hashed = password_hash($password, PASSWORD_BCRYPT);

// อัปเดตรหัสผ่าน
$query = "UPDATE Users SET password = :password WHERE username = 'admin'";
$stmt = $conn->prepare($query);
$stmt->bindParam(':password', $hashed);

if ($stmt->execute()) {
    echo "✅ อัปเดตรหัสผ่านสำเร็จ!<br>";
    echo "Username: admin<br>";
    echo "Password: admin123<br>";
    echo "<br>ลองเข้าสู่ระบบอีกครั้ง";
} else {
    echo "❌ เกิดข้อผิดพลาด";
}
?>