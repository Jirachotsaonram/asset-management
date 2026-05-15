
## สารบัญภาคผนวก

**ภาคผนวก ก** รายละเอียดโครงสร้างฐานข้อมูล (Database Schema)  
**ภาคผนวก ข** ขั้นตอนการติดตั้งและกำหนดค่าการใช้งานระบบ (System Installation and Configuration)  
**ภาคผนวก ค** ตัวอย่างรหัสต้นฉบับของโปรแกรม (Source Code Excerpts)  
**ภาคผนวก ง** คู่มือการใช้งานระบบเบื้องต้น (User Manual)  
**ภาคผนวก จ** รายละเอียดส่วนเชื่อมต่อโปรแกรมประยุกต์ (API Documentation)  
**ภาคผนวก ฉ** เครื่องมือและเทคโนโลยีที่ใช้ในการพัฒนาระบบ (Development Tools and Technologies)  
**ภาคผนวก ช** ผลการทดสอบระบบ (System Testing Results)  

---
<div style="page-break-after: always;"></div>

## ภาคผนวก ก รายละเอียดโครงสร้างฐานข้อมูล (Database Design)

ในส่วนนี้แสดงรายละเอียดของพจนานุกรมข้อมูล (Data Dictionary) และชุดคำสั่ง SQL (DDL) ที่ใช้ในระบบบริหารจัดการครุภัณฑ์

### 1. พจนานุกรมข้อมูล (Data Dictionary)

#### 1.1 ตาราง assets (ข้อมูลครุภัณฑ์)
ใช้สำหรับจัดเก็บรายละเอียดพื้นฐานของครุภัณฑ์แต่ละรายการ

| ลำดับ | ชื่อฟิลด์ | ประเภทข้อมูล | คำอธิบาย | หมายเหตุ |
|:---:|:---|:---|:---|:---|
| 1 | asset_id | int(11) | รหัสครุภัณฑ์ | Primary Key |
| 2 | asset_name | varchar(255) | ชื่อครุภัณฑ์ | |
| 3 | barcode | varchar(100) | หมายเลขบาร์โค้ด | |
| 4 | status | varchar(50) | สถานะปัจจุบัน | |
| 5 | department_id | int(11) | รหัสหน่วยงาน | Foreign Key |
| 6 | location_id | int(11) | รหัสสถานที่ | Foreign Key |

#### 1.2 ตาราง users (ข้อมูลผู้ใช้งาน)
| ลำดับ | ชื่อฟิลด์ | ประเภทข้อมูล | คำอธิบาย | หมายเหตุ |
|:---:|:---|:---|:---|:---|
| 1 | user_id | int(11) | รหัสผู้ใช้ | Primary Key |
| 2 | username | varchar(50) | ชื่อบัญชี | Unique |
| 3 | role | enum | ระดับสิทธิ์ | |

---

### 2. ชุดคำสั่ง SQL สำหรับการสร้างตาราง (DDL)

```sql
-- Table structure for table `assets`
CREATE TABLE `assets` (
  `asset_id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `asset_name` varchar(255) NOT NULL,
  `serial_number` text DEFAULT NULL,
  `quantity` int(11) DEFAULT 1,
  `unit` varchar(50) DEFAULT 'เครื่อง',
  `price` decimal(15,2) DEFAULT 0.00,
  `received_date` date DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `location_id` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'ใช้งานได้',
  `barcode` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table structure for table `asset_check`
CREATE TABLE `asset_check` (
  `check_id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `asset_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `check_date` date NOT NULL,
  `check_status` enum('ใช้งานได้','รอซ่อม','รอจำหน่าย','จำหน่ายแล้ว','ไม่พบ') DEFAULT 'ใช้งานได้',
  `remark` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table structure for table `users`
CREATE TABLE `users` (
  `user_id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `fullname` varchar(100) NOT NULL,
  `role` enum('Admin','Inspector','Viewer') NOT NULL DEFAULT 'Inspector',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## ภาคผนวก ข ขั้นตอนการติดตั้งและกำหนดค่าการใช้งานระบบ (System Installation and Configuration)

### 1. การเตรียมสภาพแวดล้อมและโปรแกรมประยุกต์พื้นฐาน
การทำงานของระบบจำเป็นต้องมีการติดตั้งโปรแกรมพื้นฐาน ดังนี้:
- **XAMPP (v8.2+):** สำหรับ Apache และ MySQL (PHP 8.2)
- **Node.js (v18+):** สำหรับ React และ React Native
- **Expo Go:** สำหรับรันแอปพลิเคชันบนมือถือจริง
- **Git:** สำหรับจัดการซอร์สโค้ด

### 2. ขั้นตอนการจัดเตรียมฐานข้อมูล
1. เปิด **XAMPP Control Panel** และกด **Start** ที่ Apache และ MySQL
2. เข้าไปที่ `http://localhost/phpmyadmin`
3. สร้างฐานข้อมูลใหม่ชื่อ `asset_management_db`
4. นำเข้าไฟล์ SQL จาก `deployment_package/asset_management_db.sql`

### 3. การติดตั้งส่วน Backend (API)
1. นำโฟลเดอร์ `asset_management_api` ไปไว้ใน `C:\xampp\htdocs\asset-management\`
2. ตรวจสอบการเชื่อมต่อใน `config/database.php`

### 4. การติดตั้งส่วน Web Frontend
1. เปิด Terminal และไปที่ `asset-frontend`
2. รันคำสั่ง `npm install`
3. รันคำสั่ง `npm run dev`
4. เข้าใช้งานผ่าน `http://localhost:5173`

### 5. การติดตั้งส่วน Mobile App
1. เปิด Terminal และไปที่ `asset-mobile`
2. รันคำสั่ง `npm install`
3. **กำหนดค่า IP Address:**
   - ตรวจสอบ IP ของคอมพิวเตอร์ด้วย `ipconfig`
   - แก้ไขค่า `YOUR_IP_ADDRESS` ใน `src/utils/constants.js` ให้ตรงกับ IP ของเครื่อง
4. รันคำสั่ง `npx expo start`
5. สแกน QR Code ด้วยแอป **Expo Go** บนมือถือ (ต้องต่อ WiFi วงเดียวกัน)

---

## ภาคผนวก ค ตัวอย่างรหัสต้นฉบับของโปรแกรม (Source Code Excerpts)

### การกำหนดค่าสถานะและสิทธิ์การใช้งาน (constants.js)
รหัสส่วนนี้ใช้กำหนดสถานะมาตรฐานของครุภัณฑ์และบทบาทของผู้ใช้งาน เพื่อให้เกิดความสอดคล้องกันทั้งระบบ

```javascript
// src/utils/constants.js
export const ASSET_STATUS = {
  AVAILABLE: 'ใช้งานได้',
  MAINTENANCE: 'รอซ่อม',
  PENDING_DISPOSAL: 'รอจำหน่าย',
  DISPOSED: 'จำหน่ายแล้ว',
  MISSING: 'ไม่พบ'
};

export const USER_ROLES = {
  ADMIN: 'Admin',
  INSPECTOR: 'Inspector',
  VIEWER: 'Viewer'
};
```

### การเชื่อมต่อฐานข้อมูล (PHP PDO)
```php
<?php
class Database {
    private $host = "localhost";
    private $db_name = "asset_management_db";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection(){
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception){
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
?>
```

---

## ภาคผนวก ง คู่มือการใช้งานระบบเบื้องต้น (User Manual)

### 1. ระบบจัดการผ่านเว็บ (Web)
- **Dashboard:** ดูภาพรวมครุภัณฑ์ สถิติการตรวจนับ และสถานะต่างๆ
- **Inventory:** จัดการข้อมูลครุภัณฑ์ (เพิ่ม/แก้ไข/ลบ) และออกรายงาน Excel
- **Audit:** ดูประวัติกิจกรรมที่เกิดขึ้นในระบบ
- **Settings:** ตั้งค่าหน่วยงาน สถานที่ และรอบการตรวจนับ

### 2. แอปพลิเคชันบนมือถือ (Mobile)
- **Scan:** สแกนบาร์โค้ดเพื่อตรวจนับครุภัณฑ์
- **Search:** ค้นหาครุภัณฑ์ตามชื่อหรือหมายเลข
- **Check-in:** ยืนยันสถานะการตรวจนับ พร้อมระบุหมายเหตุ

---

## ภาคผนวก จ รายละเอียดส่วนเชื่อมต่อโปรแกรมประยุกต์ (API Documentation)

| Endpoint | Method | Description |
|:---|:---:|:---|
| `/auth/login` | POST | ตรวจสอบสิทธิ์การเข้าใช้งาน |
| `/assets` | GET | ดึงรายการครุภัณฑ์ทั้งหมด |
| `/assets/{id}` | GET/PUT | ดูรายละเอียดหรือแก้ไขข้อมูลครุภัณฑ์ |
| `/checks` | POST | บันทึกผลการตรวจนับ |
| `/reports/summary` | GET | ดึงข้อมูลสรุปสำหรับ Dashboard |

---

## ภาคผนวก ฉ เครื่องมือและเทคโนโลยีที่ใช้ในการพัฒนาระบบ

- **Backend:** PHP 8.2, MySQL (MariaDB)
- **Web Frontend:** React 19, Vite, Tailwind CSS
- **Mobile App:** React Native, Expo Framework
- **Tools:** Visual Studio Code, Postman, XAMPP

---

## ภาคผนวก ช ผลการทดสอบระบบ (System Testing Results)

| หัวข้อการทดสอบ | วิธีการทดสอบ | ผลลัพธ์ | สถานะ |
|:---|:---|:---|:---:|
| การเข้าสู่ระบบ | ใส่ Username/Password | เข้าสู่ระบบได้ถูกต้องตามสิทธิ์ | ผ่าน |
| การเพิ่มครุภัณฑ์ | กรอกฟอร์มและบันทึก | ข้อมูลปรากฏในตารางและฐานข้อมูล | ผ่าน |
| การสแกนบาร์โค้ด | ใช้กล้องมือถือสแกน | แสดงข้อมูลครุภัณฑ์ที่ตรงกัน | ผ่าน |
| การออกรายงาน | กดปุ่ม Export Excel | ได้ไฟล์ Excel ที่มีข้อมูลถูกต้อง | ผ่าน |

---

---

