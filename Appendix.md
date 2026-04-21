

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

## ภาคผนวก ก รายละเอียดโครงสร้างฐานข้อมูล (Database Schema)

แสดงชุดคำสั่งภาษา SQL สำหรับการนิยามข้อมูล (Data Definition Language: DDL) ที่ใช้ในการสร้างฐานข้อมูลและตารางของระบบบริหารจัดการครุภัณฑ์ จำนวนทั้งสิ้น 12 ตาราง

```sql
-- Database: `asset_management_db`

-- --------------------------------------------------------
-- Table structure for table `assets`
-- --------------------------------------------------------
CREATE TABLE `assets` (
  `asset_id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `asset_name` varchar(255) NOT NULL,
  `serial_number` text DEFAULT NULL,
  `quantity` int(11) DEFAULT 1,
  `unit` varchar(50) DEFAULT 'เครื่อง',
  `price` decimal(15,2) DEFAULT 0.00,
  `received_date` date DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'ใช้งานได้',
  `barcode` varchar(100) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------
CREATE TABLE `users` (
  `user_id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `fullname` varchar(100) DEFAULT NULL,
  `role` enum('admin','inspector','viewer') DEFAULT 'viewer',
  `status` enum('active','inactive') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `departments`
-- --------------------------------------------------------
CREATE TABLE `departments` (
  `department_id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `department_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `locations`
-- --------------------------------------------------------
CREATE TABLE `locations` (
  `location_id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `building_name` varchar(100) DEFAULT NULL,
  `floor` varchar(10) DEFAULT NULL,
  `room_number` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `asset_check`
-- --------------------------------------------------------
CREATE TABLE `asset_check` (
  `check_id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `asset_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `check_date` datetime DEFAULT current_timestamp(),
  `check_status` varchar(50) DEFAULT NULL,
  `remark` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `borrow`
-- --------------------------------------------------------
CREATE TABLE `borrow` (
  `borrow_id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `asset_id` int(11) NOT NULL,
  `borrower_name` varchar(100) DEFAULT NULL,
  `borrow_date` datetime DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `return_date` datetime DEFAULT NULL,
  `status` varchar(50) DEFAULT 'ยืม'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `asset_history`
-- --------------------------------------------------------
CREATE TABLE `asset_history` (
  `history_id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `asset_id` int(11) NOT NULL,
  `old_location_id` int(11) DEFAULT NULL,
  `new_location_id` int(11) DEFAULT NULL,
  `moved_by` int(11) DEFAULT NULL,
  `move_date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `audittrail`
-- --------------------------------------------------------
CREATE TABLE `audittrail` (
  `audit_id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `asset_id` int(11) DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `action_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `check_schedules`
-- --------------------------------------------------------
CREATE TABLE `check_schedules` (
  `schedule_id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `check_interval_months` int(11) DEFAULT 12,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `asset_schedules`
-- --------------------------------------------------------
CREATE TABLE `asset_schedules` (
  `asset_schedule_id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `asset_id` int(11) NOT NULL,
  `schedule_id` int(11) NOT NULL,
  `next_check_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `import_history`
-- --------------------------------------------------------
CREATE TABLE `import_history` (
  `import_id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `import_date` datetime DEFAULT current_timestamp(),
  `filename` varchar(255) DEFAULT NULL,
  `total_rows` int(11) DEFAULT 0,
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `login_attempts`
-- --------------------------------------------------------
CREATE TABLE `login_attempts` (
  `id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `username` varchar(100) DEFAULT NULL,
  `attempt_time` datetime DEFAULT current_timestamp(),
  `success` tinyint(1) DEFAULT 0,
  `ip_address` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## ภาคผนวก ข ขั้นตอนการติดตั้งและกำหนดค่าการใช้งานระบบ (System Installation and Configuration)

### 1. การเตรียมสภาพแวดล้อมและโปรแกรมประยุกต์พื้นฐาน
การทำงานของระบบในสภาวะแวดล้อมจำลองบนเครื่องคอมพิวเตอร์ส่วนบุคคล (Local Machine) จำเป็นต้องมีการติดตั้งโปรแกรมประยุกต์พื้นฐาน ดังนี้:
- **XAMPP Control Panel (v3.3.0+):** สำหรับจำลองเครื่องแม่ข่ายเว็บ (Apache) และเครื่องแม่ข่ายฐานข้อมูล (MySQL/MariaDB)
- **Node.js (v18.x หรือสูงกว่า):** สำหรับการประมวลผลสภาพแวดล้อมการพัฒนาของ Web Frontend และ Mobile Application
- **Web Browser:** โปรแกรมรวบรวมข้อมูลเว็บ อาทิ Google Chrome หรือ Microsoft Edge
- **Expo Go:** โปรแกรมประยุกต์บนอุปกรณ์เคลื่อนที่สำหรับทดสอบการทำงานของ Mobile Application

### 2. ขั้นตอนการจัดเตรียมเครื่องแม่ข่ายจำลองและฐานข้อมูล
1. **การเริ่มต้นการทำงานของโปรแกรมจำลองแม่ข่าย (XAMPP Control Panel):**
   - เปิดโปรแกรม `XAMPP Control Panel`
   - คลิกปุ่ม **Start** ในส่วนการทำงานของ **Apache** และ **MySQL** เพื่อเริ่มต้นการทำงานของระบบ
2. **การจัดทำฐานข้อมูลผ่านระบบจัดการฐานข้อมูล (phpMyAdmin):**
   - เข้าถึงส่วนจัดการฐานข้อมูลผ่านเบราว์เซอร์ที่ลิงก์ `http://localhost/phpmyadmin`
   - เลือกคำสั่ง **"New"** (ใหม่) จากรายการเมนูด้านซ้าย
   - กำหนดชื่อฐานข้อมูลเป็น `asset_management_db` และกำหนดรูปแบบการจัดเรียง (Collation) เป็น `utf8mb4_general_ci` จากนั้นคลิกปุ่ม **Create** เพื่อจัดสร้างฐานข้อมูล
3. **การนำเข้าแฟ้มข้อมูลโครงสร้างฐานข้อมูล (SQL Import):**
   - ภายหลังจากการสร้างฐานข้อมูล `asset_management_db` ให้เลือกแท็บ **"Import"** (นำเข้า) จากเมนูด้านบน
   - คลิกปุ่ม **Choose File** เพื่อทำการเลือกแฟ้มข้อมูลจากพาธ `deployment_package/asset_management_db.sql`
   - ดำเนินการคลิกปุ่ม **Import** ด้านล่างสุด เพื่อเสร็จสิ้นขั้นตอนการนำเข้าข้อมูลโครงสร้าง

### 3. การติดตั้งและกำหนดค่าส่วนเชื่อมต่อฐานข้อมูล (Backend API)
1. **การจัดเก็บแฟ้มข้อมูลระบบ:**
   - ดำเนินการคัดลอกโฟลเดอร์โครงการ (เฉพาะโฟลเดอร์ `asset_management_api`) ไปจัดเก็บไว้ในพาธต้นทางของเครื่องแม่ข่ายเว็บ ที่ `C:\xampp\htdocs\asset-management\`
2. **การตรวจสอบการเชื่อมต่อฐานข้อมูล:**
   - ตรวจสอบความถูกต้องของแฟ้มข้อมูล `asset_management_api/config/database.php`
   - สำหรับการใช้งานในสภาวะแวดล้อม Local Machine ให้มั่นใจว่าค่าพารามิเตอร์เบื้องต้นกำหนดไว้ดังนี้:
     - `host = "localhost"`
     - `db_name = "asset_management_db"`
     - `username = "root"`
     - `password = ""` (ว่างข้อมูล)

### 4. การเริ่มต้นการทำงานของส่วนติดต่อผู้ใช้งานผ่านเครือข่ายอินเทอร์เน็ต (Web Frontend)
1. เปิดโปรแกรมรับคำสั่ง (Terminal) หรือ Command Prompt (CMD)
2. เข้าสู่โฟลเดอร์โครงการด้วยคำสั่ง: `cd C:\xampp\htdocs\asset-management\asset-frontend`
3. ดำเนินการติดตั้งชุดคำสั่งเสริม (Dependencies) ด้วยคำสั่ง (สำหรับครั้งแรก):
   ```bash
   npm install
   ```
4. เริ่มต้นการทำงานของเครื่องแม่ข่ายสำหรับการพัฒนา (Development Server):
   ```bash
   npm run dev
   ```
5. ระบบจะแสดงที่อยู่เว็บ อาทิ `http://localhost:5173` ให้ดำเนินการเปิดที่อยู่ดังกล่าวผ่านโปรแกรมเบราว์เซอร์เพื่อเข้าใช้งานระบบ

### 5. การติดตั้งและเริ่มต้นการทำงานของโปรแกรมประยุกต์บนอุปกรณ์เคลื่อนที่ (Mobile Application)
1. เข้าสู่โฟลเดอร์สำหรับแอปพลิเคชันเคลื่อนที่: `cd C:\xampp\htdocs\asset-management\asset-mobile`
2. ดำเนินการติดตั้งชุดคำสั่งเสริม (Dependencies) ด้วยคำสั่ง:
   ```bash
   npm install
   ```
3. **การกำหนดค่าหมายเลขไอพีของเครื่องแม่ข่าย (IP Address Configuration):**
   - ดำเนินการตรวจสอบหมายเลขไอพี (IP Address) ของเครื่องคอมพิวเตอร์แม่ข่าย (โดยใช้คำสั่ง `ipconfig` ใน CMD)
   - เปิดแฟ้มข้อมูลที่พาธ `asset-mobile/src/utils/constants.js`
   - ดำเนินการแก้ไขค่า `API_BASE_URL` จากเดิมที่เป็น `localhost` ให้เป็นหมายเลขไอพีของเครื่องแม่ข่าย ตัวอย่างเช่น:
     `export const API_BASE_URL = 'http://192.168.1.35/asset-management/asset_management_api';`
4. การเริ่มต้นการทำงานของโปรแกรมประยุกต์:
   ```bash
   npx expo start
   ```
5. ดำเนินการสแกนรหัสคิวอาร์ (QR Code) ผ่านโปรแกรมประยุกต์ **Expo Go** บนอุปกรณ์เคลื่อนที่ เพื่อเริ่มต้นการทดสอบระบบ

---

---

## ภาคผนวก ค ตัวอย่างรหัสต้นฉบับของโปรแกรม (Source Code Excerpts)

### ตัวอย่าง: การกำหนดค่าพื้นฐานและสถานะการดำเนินงานของครุภัณฑ์ (constants.js)
รหัสต้นฉบับในส่วนนี้ใช้สำหรับการกำหนดค่าคงที่พื้นฐานของระบบ อาทิ เส้นทางมาตรฐานของส่วนเชื่อมต่อโปรแกรม (API) และสถานะประเภทต่างๆ ของครุภัณฑ์

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

export const API_BASE_URL = 'http://202.44.47.45/asset-management/asset_management_api';
```

### ตัวอย่าง: การเชื่อมต่อฐานข้อมูล (PHP API Example)
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

### 1. ระบบบริหารจัดการผ่านเครือข่ายอินเทอร์เน็ต (Web Administration System)
- **การเข้าสู่ระบบ (Authentication):** ผู้ใช้งานดำเนินการระบุบัญชีผู้ใช้ (Username) และรหัสผ่าน (Password) เพื่อเข้ารับการพิสูจน์ตัวตนตามสิทธิ์การใช้งานที่กำหนด (อาทิ ผู้ดูแลระบบ, ผู้ตรวจนับ หรือผู้เข้าชมทั่วไป)
- **ส่วนแสดงผลรายการครุภัณฑ์ (Asset Inventory Display):** แสดงรายละเอียดรายการครุภัณฑ์ทั้งหมดในระบบ พร้อมระบบกรองข้อมูล (Filter) ตามหน่วยงาน สถานะการใช้งาน หรืออาคารสถานที่
- **การบริหารจัดการข้อมูล (Data Management):** ผู้ดูแลระบบ (Administrator) มีสิทธิ์ในการเพิ่ม แก้ไข หรือลบข้อมูลพื้นฐาน อันประกอบด้วย ข้อมูลครุภัณฑ์ ข้อมูลหน่วยงาน และข้อมูลสถานที่
- **การสรุปผลและรายงาน (Reporting):** ระบบรองรับการส่งออกข้อมูลสารสนเทศ (Data Export) ในรูปแบบรายงานสรุปครุภัณฑ์และประวัติการตรวจนับ โดยจัดทำในรูปแบบแฟ้มข้อมูลมาตรฐาน CSV และ Microsoft Excel

### 2. โปรแกรมประยุกต์บนอุปกรณ์เคลื่อนที่ (Mobile Application)
- **การตรวจนับและยืนยันตัวตนครุภัณฑ์:** ผู้ตรวจนับ (Inspector) ดำเนินการประมวลผลการอ่านรหัสแท่ง (Barcode Scanning) ผ่านอุปกรณ์กล้อง หรือใช้ระบบรู้จำตัวอักษรทางแสง (Optical Character Recognition: OCR) เพื่อตรวจสอบหมายเลขประจำครุภัณฑ์จากตัวเครื่อง
- **การจัดเก็บสถานะการดำเนินงาน:** เมื่อดำเนินการตรวจนับเสร็จสิ้น ข้อมูลจะถูกส่งไปยังส่วนรับข้อมูลส่วนกลาง (Backend) เพื่อจัดเก็บฐานข้อมูลโดยอัตโนมัติ พร้อมระบุวัน เวลา และข้อมูลผู้ดำเนินการ
- **การดำเนินธุรกรรมการยืมและการส่งคืน:** ระบบรองรับการบันทึกรายการยืมครุภัณฑ์และการยืนยันการส่งคืนผ่านอุปกรณ์เคลื่อนที่ เพื่อความสะดวกในการติดตามสถานะทางกายภาพ

---

## ภาคผนวก จ รายละเอียดส่วนเชื่อมต่อโปรแกรมประยุกต์ (API Documentation)

แสดงรายละเอียดจุดเชื่อมต่อเชิงโปรแกรม (API Endpoints) ที่สำคัญสำหรับการรับส่งข้อมูลระหว่างส่วนติดต่อผู้ใช้งานและระบบจัดการฐานข้อมูล:

| จุดเชื่อมต่อ (Endpoint) | วิธีการ (Method) | คำอธิบายการทำงาน |
|:---|:---:|:---|
| `/auth/login` | POST | กระบวนการตรวจสอบสิทธิ์และพิสูจน์ตัวตนเพื่อเข้าสู่ระบบ |
| `/assets` | GET | การเรียกดูข้อมูลรายการครุภัณฑ์ทั้งหมด (รองรับการสืบค้นข้อมูล) |
| `/assets/{id}` | GET/PUT | การเรียกดูรายละเอียดเฉพาะรายการหรือการปรับปรุงข้อมูลครุภัณฑ์ |
| `/checks` | POST | การจัดเก็บผลการดำเนินการตรวจนับครุภัณฑ์รายการใหม่ |
| `/checks/unchecked` | GET | การเรียกดูรายการครุภัณฑ์ที่ยังไม่ได้รับการดำเนินการตรวจนับตามรอบเวลา |
| `/borrows` | POST | การจัดเก็บข้อมูลการดำเนินธุรกรรมการยืมครุภัณฑ์ |
| `/reports/asset-summary` | GET | การดึงข้อมูลดัชนีภาพรวมครุภัณฑ์เพื่อการวิเคราะห์และออกรายงาน |
| `/upload/asset/{id}` | POST | กระบวนการจัดส่งแฟ้มข้อมูลภาพถ่ายครุภัณฑ์เข้าสู่ระบบจัดเก็บ |

---

## ภาคผนวก ฉ เครื่องมือและเทคโนโลยีที่ใช้ในการพัฒนาระบบ (Development Tools and Technologies)

### 1. ระบบประมวลผลส่วนหลังและฐานข้อมูล (Backend and Database)
- **ภาษาที่ใช้ในการพัฒนา:** PHP (Hypertext Preprocessor)
- **ระบบบริหารจัดการฐานข้อมูล:** MySQL / MariaDB โดยดำเนินการผ่านเทคโนโลยี PDO (PHP Data Objects)
- **สถาปัตยกรรมบริการเว็บ:** พัฒนาตามแนวทาง RESTful API เพื่อใช้ในการแลกเปลี่ยนข้อมูลในรูปแบบมาตรฐาน JSON

### 2. ส่วนติดต่อผู้ใช้งานผ่านระบบเว็บ (Web Frontend Interface)
- **ไลบรารีหลักในการพัฒนา:** React.js (เวอร์ชัน 19)
- **เทคโนโลยีจัดการข้อมูลสถานะ:** TanStack Query (React Query)
- **โครงร่างการจัดรูปแบบการแสดงผล:** Tailwind CSS (CSS Framework สำหรับการออกแบบส่วนติดต่อผู้ใช้งาน)
- **ซอฟต์แวร์สนับสนุน:** Axios (สำหรับการส่งคำขอเชิงเครือข่าย), Recharts (สำหรับการประมวลผลกราฟฟิกเชิงสถิติ)

### 3. ส่วนพัฒนาโปรแกรมประยุกต์บนอุปกรณ์เคลื่อนที่ (Mobile Application Interface)
- **โครงร่างการพัฒนา:** React Native ภายใต้สภาพแวดล้อมการทำงานของ Expo Framework
- **ส่วนเชื่อมต่ออุปกรณ์ฮาร์ดแวร์:** Expo Camera (การประมวลผลผ่านอุปกรณ์กล้อง), Expo Image Picker (การจัดการแฟ้มข้อมูลภาพ)
- **เทคโนโลยีรู้จำข้อมูล:** Tesseract.js (สำหรับการดำเนินกระบวนการ Optical Character Recognition: OCR)

---

## ภาคผนวก ช ผลการทดสอบระบบ (System Testing Results)

แสดงตัวอย่างรายการทดสอบความถูกต้องของคุณสมบัติการทำงานพื้นฐาน (Functional Testing) ภายในระบบบริหารจัดการครุภัณฑ์:

### 1. การทดสอบระบบความปลอดภัยและการเข้าใช้งาน (Security and Login Testing)
| รายการทดสอบ | ขั้นตอนการดำเนินงาน | ผลลัพธ์ที่คาดหวัง | สถานะการทดสอบ |
|:---|:---|:---|:---:|
| การเข้าสู่ระบบด้วยข้อมูลที่ถูกต้อง | ระบุบัญชีผู้ใช้และรหัสผ่านที่ถูกต้องในระบบ | ระบบอนุญาตให้เข้าถึงส่วนบริหารงานตามสิทธิ์ | ผ่าน (Pass) |
| การเข้าสู่ระบบด้วยข้อมูลที่ไม่ถูกต้อง | ระบุรหัสผ่านไม่ถูกต้อง | ระบบแจ้งเตือนข้อผิดพลาดและปฏิเสธการเข้าถึง | ผ่าน (Pass) |
| การตรวจสอบสิทธิ์ตามระดับ (Role-based) | เข้าใช้งานฟังก์ชัน Administrator ด้วยบัญชี Viewer | ระบบจำกัดการเข้าถึงและไม่อนุญาตให้ดำเนินการ | ผ่าน (Pass) |

### 2. การทดสอบการจัดการข้อมูลครุภัณฑ์ (Asset Management Testing)
| รายการทดสอบ | ขั้นตอนการดำเนินงาน | ผลลัพธ์ที่คาดหวัง | สถานะการทดสอบ |
|:---|:---|:---|:---:|
| การเพิ่มข้อมูลครุภัณฑ์ใหม่ | บันทึกข้อมูลครุภัณฑ์ครบถ้วนตามแบบฟอร์มที่กำหนด | ระบบดำเนินการจัดเก็บข้อมูลลงในฐานข้อมูลสำเร็จ | ผ่าน (Pass) |
| การจัดทำรหัสบาร์โค้ดครุภัณฑ์ | สั่งพิมพ์รหัสบาร์โค้ดจากส่วนสรุปข้อมูล | ระบบสร้างแฟ้มข้อมูล PDF ที่มีรหัสบาร์โค้ดที่ถูกต้อง | ผ่าน (Pass) |
| การปรับปรุงข้อมูลสถานะ | ดำเนินการแก้ไขสถานะการใช้งานของครุภัณฑ์ | ข้อมูลสถานะในฐานข้อมูลมีการเปลี่ยนแปลงตามที่ระบุ | ผ่าน (Pass) |

### 3. การทดสอบการประมวลผลผ่านอุปกรณ์เคลื่อนที่ (Mobile Application Testing)
| รายการทดสอบ | ขั้นตอนการดำเนินงาน | ผลลัพธ์ที่คาดหวัง | สถานะการทดสอบ |
|:---|:---|:---|:---:|
| การประมวลผลการอ่านรหัส (Barcode Scanning) | ใช้กล้องอุปกรณ์สแกนรหัสแท่งจากตัวเครื่อง | ระบบทำการเรียกดูข้อมูลครุภัณฑ์ที่ตรงกันมาแสดงผล | ผ่าน (Pass) |
| การพิสูจน์ค่าอักษรทางแสง (OCR) | ประมวลผลภาพหมายเลขประจำเครื่อง (Serial Number) | ระบบแปลงภาพเป็นตัวอักษรและค้นหาข้อมูลได้แม่นยำ | ผ่าน (Pass) |
| การบันทึกผลการสำรวจครุภัณฑ์ | บันทึกสถานะการตรวจนับผ่านโปรแกรมเคลื่อนที่ | ข้อมูลวันเวลาและผู้ดำเนินการถูกจัดเก็บครบถ้วน | ผ่าน (Pass) |

---

