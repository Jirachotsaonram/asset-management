<?php
// ไฟล์ test_upload_direct.php
// ใช้ทดสอบว่า Upload ทำงานได้หรือไม่

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>ทดสอบระบบ Upload</h2>";

// 1. ตรวจสอบโฟลเดอร์
echo "<h3>1. ตรวจสอบโฟลเดอร์</h3>";
$upload_dir = 'uploads/assets/';

if (!file_exists($upload_dir)) {
    echo "❌ ไม่พบโฟลเดอร์ {$upload_dir}<br>";
    echo "กำลังสร้างโฟลเดอร์...<br>";
    if (mkdir($upload_dir, 0777, true)) {
        echo "✅ สร้างโฟลเดอร์สำเร็จ<br>";
    } else {
        echo "❌ ไม่สามารถสร้างโฟลเดอร์ได้<br>";
    }
} else {
    echo "✅ พบโฟลเดอร์ {$upload_dir}<br>";
}

// ตรวจสอบสิทธิ์เขียน
if (is_writable($upload_dir)) {
    echo "✅ สามารถเขียนไฟล์ได้<br>";
} else {
    echo "❌ ไม่สามารถเขียนไฟล์ได้ (ตรวจสอบ permission)<br>";
}

// 2. ตรวจสอบ PHP Extensions
echo "<h3>2. ตรวจสอบ PHP Extensions</h3>";
$required_extensions = ['gd', 'pdo', 'pdo_mysql'];
foreach ($required_extensions as $ext) {
    if (extension_loaded($ext)) {
        echo "✅ Extension: {$ext}<br>";
    } else {
        echo "❌ ไม่พบ Extension: {$ext}<br>";
    }
}

// 3. ตรวจสอบการตั้งค่า PHP
echo "<h3>3. ตรวจสอบการตั้งค่า PHP</h3>";
echo "upload_max_filesize: " . ini_get('upload_max_filesize') . "<br>";
echo "post_max_size: " . ini_get('post_max_size') . "<br>";
echo "max_execution_time: " . ini_get('max_execution_time') . " วินาที<br>";
echo "memory_limit: " . ini_get('memory_limit') . "<br>";

// 4. ทดสอบ Upload
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['test_image'])) {
    echo "<h3>4. ผลการ Upload</h3>";
    
    $file = $_FILES['test_image'];
    echo "ชื่อไฟล์: " . $file['name'] . "<br>";
    echo "ขนาด: " . $file['size'] . " bytes<br>";
    echo "ประเภท: " . $file['type'] . "<br>";
    echo "Error Code: " . $file['error'] . "<br>";
    
    if ($file['error'] === UPLOAD_ERR_OK) {
        $filename = uniqid('test_', true) . '.jpg';
        $filepath = $upload_dir . $filename;
        
        if (move_uploaded_file($file['tmp_name'], $filepath)) {
            echo "✅ Upload สำเร็จ!<br>";
            echo "บันทึกที่: {$filepath}<br>";
            echo "<img src='{$filepath}' style='max-width: 300px; margin-top: 10px;'><br>";
        } else {
            echo "❌ ไม่สามารถย้ายไฟล์ได้<br>";
        }
    } else {
        $errors = [
            UPLOAD_ERR_INI_SIZE => 'ไฟล์ใหญ่เกิน upload_max_filesize',
            UPLOAD_ERR_FORM_SIZE => 'ไฟล์ใหญ่เกิน MAX_FILE_SIZE',
            UPLOAD_ERR_PARTIAL => 'อัปโหลดไม่สมบูรณ์',
            UPLOAD_ERR_NO_FILE => 'ไม่มีไฟล์',
            UPLOAD_ERR_NO_TMP_DIR => 'ไม่พบโฟลเดอร์ temp',
            UPLOAD_ERR_CANT_WRITE => 'เขียนไฟล์ไม่สำเร็จ',
            UPLOAD_ERR_EXTENSION => 'PHP extension หยุดการอัปโหลด'
        ];
        echo "❌ Error: " . ($errors[$file['error']] ?? 'ไม่ทราบสาเหตุ') . "<br>";
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ทดสอบ Upload</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h2 { color: #333; }
        h3 { color: #666; margin-top: 20px; }
        form { margin-top: 20px; padding: 20px; background: #f0f0f0; border-radius: 5px; }
    </style>
</head>
<body>
    <form method="POST" enctype="multipart/form-data">
        <h3>ทดสอบ Upload รูปภาพ</h3>
        <input type="file" name="test_image" accept="image/*" required>
        <button type="submit">Upload ทดสอบ</button>
    </form>
</body>
</html>