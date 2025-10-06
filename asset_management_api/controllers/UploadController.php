<?php
require_once 'config/database.php';
require_once 'models/Asset.php';
require_once 'utils/ImageUpload.php';
require_once 'utils/Response.php';

class UploadController {
    private $db;
    private $asset;
    private $imageUpload;

    public function __construct() {
        try {
            $database = new Database();
            $this->db = $database->getConnection();
            $this->asset = new Asset($this->db);
            $this->imageUpload = new ImageUpload();
        } catch (Exception $e) {
            Response::error('เกิดข้อผิดพลาด: ' . $e->getMessage(), 500);
        }
    }

    public function uploadAssetImage($asset_id) {
        try {
            // ตรวจสอบว่ามีไฟล์หรือไม่
            if (!isset($_FILES['image'])) {
                Response::error('กรุณาเลือกไฟล์รูปภาพ', 400);
            }

            if ($_FILES['image']['error'] !== UPLOAD_ERR_OK) {
                $errors = [
                    UPLOAD_ERR_INI_SIZE => 'ไฟล์มีขนาดใหญ่เกินที่กำหนดใน php.ini',
                    UPLOAD_ERR_FORM_SIZE => 'ไฟล์มีขนาดใหญ่เกินที่กำหนด',
                    UPLOAD_ERR_PARTIAL => 'อัปโหลดไฟล์ไม่สมบูรณ์',
                    UPLOAD_ERR_NO_FILE => 'ไม่มีไฟล์ถูกอัปโหลด',
                    UPLOAD_ERR_NO_TMP_DIR => 'ไม่พบโฟลเดอร์ temp',
                    UPLOAD_ERR_CANT_WRITE => 'เขียนไฟล์ลงดิสก์ไม่สำเร็จ',
                    UPLOAD_ERR_EXTENSION => 'PHP extension หยุดการอัปโหลด'
                ];
                $error_message = $errors[$_FILES['image']['error']] ?? 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ';
                Response::error($error_message, 400);
            }

            // ตรวจสอบว่ามีครุภัณฑ์หรือไม่
            $this->asset->asset_id = $asset_id;
            $stmt = $this->asset->readOne();
            
            if ($stmt->rowCount() == 0) {
                Response::error('ไม่พบครุภัณฑ์', 404);
            }

            $asset_data = $stmt->fetch(PDO::FETCH_ASSOC);
            $old_image = $asset_data['image'];

            // Upload รูปภาพ
            $result = $this->imageUpload->upload($_FILES['image'], $old_image);

            if ($result['success']) {
                // อัปเดตชื่อไฟล์ในฐานข้อมูล
                $query = "UPDATE Assets SET image = :image WHERE asset_id = :asset_id";
                $stmt = $this->db->prepare($query);
                $stmt->bindParam(':image', $result['filepath']);
                $stmt->bindParam(':asset_id', $asset_id);

                if ($stmt->execute()) {
                    Response::success('อัปโหลดรูปภาพสำเร็จ', [
                        'filename' => $result['filename'],
                        'filepath' => $result['filepath'],
                        'url' => $this->imageUpload->getImageUrl($result['filename'])
                    ]);
                } else {
                    // ถ้าบันทึกฐานข้อมูลไม่สำเร็จ ให้ลบไฟล์ที่อัปโหลด
                    $this->imageUpload->deleteImage($result['filepath']);
                    Response::error('ไม่สามารถบันทึกข้อมูลได้', 500);
                }
            } else {
                Response::error($result['message'], 400);
            }
        } catch (Exception $e) {
            Response::error('เกิดข้อผิดพลาด: ' . $e->getMessage(), 500);
        }
    }

    public function deleteAssetImage($asset_id) {
        try {
            // ตรวจสอบว่ามีครุภัณฑ์หรือไม่
            $this->asset->asset_id = $asset_id;
            $stmt = $this->asset->readOne();
            
            if ($stmt->rowCount() == 0) {
                Response::error('ไม่พบครุภัณฑ์', 404);
            }

            $asset_data = $stmt->fetch(PDO::FETCH_ASSOC);
            $image_path = $asset_data['image'];

            if (empty($image_path)) {
                Response::error('ครุภัณฑ์นี้ไม่มีรูปภาพ', 400);
            }

            // ลบรูปภาพ
            if ($this->imageUpload->deleteImage($image_path)) {
                // อัปเดตฐานข้อมูล
                $query = "UPDATE Assets SET image = NULL WHERE asset_id = :asset_id";
                $stmt = $this->db->prepare($query);
                $stmt->bindParam(':asset_id', $asset_id);

                if ($stmt->execute()) {
                    Response::success('ลบรูปภาพสำเร็จ');
                } else {
                    Response::error('ไม่สามารถอัปเดตข้อมูลได้', 500);
                }
            } else {
                Response::error('ไม่สามารถลบรูปภาพได้', 500);
            }
        } catch (Exception $e) {
            Response::error('เกิดข้อผิดพลาด: ' . $e->getMessage(), 500);
        }
    }

    public function uploadMultipleImages() {
        try {
            if (!isset($_FILES['images'])) {
                Response::error('กรุณาเลือกไฟล์รูปภาพ', 400);
            }

            $files = $_FILES['images'];
            $uploaded = [];
            $errors = [];

            // วนลูปอัปโหลดหลายไฟล์
            for ($i = 0; $i < count($files['name']); $i++) {
                if ($files['error'][$i] === UPLOAD_ERR_OK) {
                    $file = [
                        'name' => $files['name'][$i],
                        'type' => $files['type'][$i],
                        'tmp_name' => $files['tmp_name'][$i],
                        'error' => $files['error'][$i],
                        'size' => $files['size'][$i]
                    ];

                    $result = $this->imageUpload->upload($file);

                    if ($result['success']) {
                        $uploaded[] = [
                            'filename' => $result['filename'],
                            'url' => $this->imageUpload->getImageUrl($result['filename'])
                        ];
                    } else {
                        $errors[] = $files['name'][$i] . ': ' . $result['message'];
                    }
                }
            }

            Response::success('อัปโหลดเสร็จสิ้น', [
                'uploaded' => $uploaded,
                'errors' => $errors,
                'total' => count($uploaded),
                'failed' => count($errors)
            ]);
        } catch (Exception $e) {
            Response::error('เกิดข้อผิดพลาด: ' . $e->getMessage(), 500);
        }
    }
}
?>