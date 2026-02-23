<?php
class ImageUpload {
    private $upload_dir = 'uploads/assets/';
    private $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    private $max_size = 5242880; // 5MB
    private $max_width = 1920;
    private $max_height = 1080;

    public function __construct() {
        // สร้างโฟลเดอร์ถ้ายังไม่มี
        if (!file_exists($this->upload_dir)) {
            mkdir($this->upload_dir, 0777, true);
        }
    }

    public function upload($file, $old_image = null) {
        // ตรวจสอบว่ามีไฟล์หรือไม่
        if (!isset($file['tmp_name']) || empty($file['tmp_name'])) {
            return ['success' => false, 'message' => 'ไม่พบไฟล์'];
        }

        // ตรวจสอบ error
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return ['success' => false, 'message' => 'เกิดข้อผิดพลาดในการอัปโหลด'];
        }

        // ตรวจสอบประเภทไฟล์
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime_type = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mime_type, $this->allowed_types)) {
            return ['success' => false, 'message' => 'ประเภทไฟล์ไม่ถูกต้อง (รองรับเฉพาะ JPG, PNG, GIF)'];
        }

        // ตรวจสอบขนาดไฟล์
        if ($file['size'] > $this->max_size) {
            return ['success' => false, 'message' => 'ขนาดไฟล์เกิน 5MB'];
        }

        // Create new filename
        $extension = $this->getExtension($mime_type);
        $filename = uniqid('asset_', true) . '.' . $extension;
        $filepath = $this->upload_dir . $filename;

        // Try to Resize if GD is available, otherwise just move the file
        $upload_success = false;
        if (function_exists('imagecreatefromjpeg')) {
            $upload_success = $this->resizeImage($file['tmp_name'], $filepath, $mime_type);
        } else {
            // Fallback: Just move the file
            $upload_success = move_uploaded_file($file['tmp_name'], $filepath);
        }

        if ($upload_success) {
            // Delete old if exists
            if ($old_image && file_exists($old_image)) {
                unlink($old_image);
            }

            return [
                'success' => true,
                'message' => 'อัปโหลดรูปภาพสำเร็จ',
                'filename' => $filename,
                'filepath' => $filepath
            ];
        } else {
            return ['success' => false, 'message' => 'ไม่สามารถบันทึกรูปภาพได้ (โปรดตรวจสอบสิทธิ์โฟลเดอร์หรือเปิดใช้งาน GD extension)'];
        }
    }

    private function resizeImage($source, $destination, $mime_type) {
        // สร้าง image resource จาก source
        switch ($mime_type) {
            case 'image/jpeg':
            case 'image/jpg':
                $image = imagecreatefromjpeg($source);
                break;
            case 'image/png':
                $image = imagecreatefrompng($source);
                break;
            case 'image/gif':
                $image = imagecreatefromgif($source);
                break;
            default:
                return false;
        }

        if (!$image) {
            return false;
        }

        // ดึงขนาดรูปต้นฉบับ
        $width = imagesx($image);
        $height = imagesy($image);

        // คำนวณขนาดใหม่
        if ($width > $this->max_width || $height > $this->max_height) {
            $ratio = min($this->max_width / $width, $this->max_height / $height);
            $new_width = round($width * $ratio);
            $new_height = round($height * $ratio);
        } else {
            $new_width = $width;
            $new_height = $height;
        }

        // สร้างรูปใหม่
        $new_image = imagecreatetruecolor($new_width, $new_height);

        // รักษาความโปร่งใสสำหรับ PNG และ GIF
        if ($mime_type == 'image/png' || $mime_type == 'image/gif') {
            imagealphablending($new_image, false);
            imagesavealpha($new_image, true);
            $transparent = imagecolorallocatealpha($new_image, 255, 255, 255, 127);
            imagefilledrectangle($new_image, 0, 0, $new_width, $new_height, $transparent);
        }

        // Resize
        imagecopyresampled($new_image, $image, 0, 0, 0, 0, $new_width, $new_height, $width, $height);

        // บันทึกรูป
        $result = false;
        switch ($mime_type) {
            case 'image/jpeg':
            case 'image/jpg':
                $result = imagejpeg($new_image, $destination, 85);
                break;
            case 'image/png':
                $result = imagepng($new_image, $destination, 8);
                break;
            case 'image/gif':
                $result = imagegif($new_image, $destination);
                break;
        }

        // ล้างหน่วยความจำ
        imagedestroy($image);
        imagedestroy($new_image);

        return $result;
    }

    private function getExtension($mime_type) {
        switch ($mime_type) {
            case 'image/jpeg':
            case 'image/jpg':
                return 'jpg';
            case 'image/png':
                return 'png';
            case 'image/gif':
                return 'gif';
            default:
                return 'jpg';
        }
    }

    public function deleteImage($filepath) {
        if (file_exists($filepath)) {
            return unlink($filepath);
        }
        return false;
    }

    public function getImageUrl($filename) {
        if (empty($filename)) {
            return null;
        }
        // สร้าง URL สำหรับเข้าถึงรูปภาพ
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $base_path = dirname($_SERVER['SCRIPT_NAME']);
        return $protocol . '://' . $host . $base_path . '/' . $this->upload_dir . $filename;
    }
}
?>