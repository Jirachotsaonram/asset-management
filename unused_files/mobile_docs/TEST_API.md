# วิธีทดสอบ API

## URL ที่ถูกต้องสำหรับทดสอบ API

API ของคุณไม่แสดงอะไรเมื่อเปิดที่ root path เพราะมันเป็น REST API ที่ต้องเรียก endpoint ที่เฉพาะเจาะจง

### วิธีทดสอบ API:

1. **ทดสอบ Login Endpoint:**
   ```
   http://192.168.80.1/asset-management/asset_management_api/auth/login
   ```
   หรือใช้ Postman/curl:
   ```bash
   POST http://192.168.80.1/asset-management/asset_management_api/auth/login
   Content-Type: application/json
   
   {
     "username": "admin",
     "password": "admin123"
   }
   ```

2. **ทดสอบ Assets Endpoint (ต้องมี token):**
   ```
   GET http://192.168.80.1/asset-management/asset_management_api/assets
   Authorization: Bearer YOUR_TOKEN
   ```

3. **ทดสอบด้วย Browser:**
   - เปิดเบราว์เซอร์
   - ไปที่: `http://192.168.80.1/asset-management/asset_management_api/auth/login`
   - อาจจะเห็น error message (เพราะต้องส่ง POST request) แต่ถ้าเห็น response ใดๆ แสดงว่า API ทำงาน

### ตรวจสอบว่า API ทำงาน:

**วิธีที่ 1: ใช้ Developer Tools**
1. เปิดเบราว์เซอร์ (Chrome/Firefox)
2. เปิด Developer Tools (F12)
3. ไปที่ tab "Network"
4. เปิด URL: `http://192.168.80.1/asset-management/asset_management_api/auth/login`
5. ดูว่ามี request ไปยัง server หรือไม่

**วิธีที่ 2: ใช้ curl (Command Line)**
```bash
curl -X POST http://192.168.80.1/asset-management/asset_management_api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

**วิธีที่ 3: ตรวจสอบ XAMPP**
1. เปิด XAMPP Control Panel
2. ตรวจสอบว่า Apache กำลังทำงาน (แสดงสีเขียว)
3. ตรวจสอบว่า MySQL กำลังทำงาน (ถ้าต้องการ)

### หาก API ไม่ทำงาน:

1. **ตรวจสอบ Apache:**
   - ตรวจสอบว่า Apache ใน XAMPP กำลังทำงาน
   - ตรวจสอบว่า port 80 ไม่ถูกใช้งานโดยโปรแกรมอื่น

2. **ตรวจสอบไฟล์:**
   - ตรวจสอบว่าไฟล์ `index.php` มีอยู่ใน `asset_management_api` folder
   - ตรวจสอบ permissions ของไฟล์

3. **ตรวจสอบ Error Logs:**
   - ดู error log ของ Apache ใน XAMPP
   - ดู error log ของ PHP ใน `asset_management_api/error.log`

4. **ทดสอบ XAMPP:**
   - เปิด `http://localhost` ควรเห็น XAMPP dashboard
   - เปิด `http://localhost/asset-management/asset_management_api/auth/login` ควรเห็น response

### สำหรับ Mobile App:

ถ้า API ไม่ทำงานจาก IP address แต่ทำงานจาก localhost:
1. ตรวจสอบ Windows Firewall
2. ตรวจสอบว่า Apache bind ไปที่ IP address ที่ถูกต้อง
3. ตรวจสอบ network settings

