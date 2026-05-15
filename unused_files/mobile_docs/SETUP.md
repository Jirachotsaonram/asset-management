# คู่มือการตั้งค่า Mobile App

## การตั้งค่า API URL

เนื่องจากแอปมือถือต้องเชื่อมต่อกับ API server ที่รันบนเครื่องคอมพิวเตอร์ คุณต้องตั้งค่า API_BASE_URL ให้ถูกต้อง

### 1. หา IP Address ของเครื่องคอมพิวเตอร์

**Windows:**
```bash
ipconfig
```
หา IPv4 Address (มักจะเป็น 192.168.x.x หรือ 10.0.x.x)

**Mac/Linux:**
```bash
ifconfig
```
หา inet address ของ network interface

### 2. แก้ไขไฟล์ `src/utils/constants.js`

เปิดไฟล์ `asset-mobile/src/utils/constants.js` และแก้ไข API_BASE_URL:

```javascript
export const API_BASE_URL = 'http://YOUR_IP_ADDRESS/asset-management/asset_management_api';
```

ตัวอย่าง:
```javascript
export const API_BASE_URL = 'http://192.168.1.100/asset-management/asset_management_api';
```

### 3. ตรวจสอบว่า API Server รันอยู่

เปิดเบราว์เซอร์และไปที่:
```
http://YOUR_IP_ADDRESS/asset-management/asset_management_api
```

ควรเห็น response จาก API

### 4. ตรวจสอบ Firewall

ตรวจสอบว่า firewall อนุญาตการเข้าถึง port ที่ API ใช้ (ปกติคือ 80 หรือ 8080)

**Windows Firewall:**
- ไปที่ Windows Defender Firewall
- Advanced Settings
- Inbound Rules
- เพิ่ม rule สำหรับ Apache/XAMPP

**Mac:**
- System Preferences > Security & Privacy > Firewall
- อนุญาต Apache/HTTP Server

### 5. สำหรับ Emulator/Simulator

**Android Emulator:**
- ใช้ `http://10.0.2.2/asset-management/asset_management_api` (ไม่ใช่ localhost)

**iOS Simulator:**
- ใช้ `http://localhost/asset-management/asset_management_api` ได้

## การทดสอบ

1. รัน API server (XAMPP, WAMP, หรือ server อื่นๆ)
2. ตรวจสอบว่า API ทำงานได้โดยเปิดเบราว์เซอร์
3. รัน mobile app
4. ล็อกอินด้วย username/password ที่มีอยู่ในระบบ

## แก้ไขปัญหา

### ไม่สามารถเชื่อมต่อ API ได้

1. ตรวจสอบว่า API_BASE_URL ถูกต้อง
2. ตรวจสอบว่า API server กำลังทำงาน
3. ตรวจสอบ firewall
4. ตรวจสอบว่าเครื่องมือถือและคอมพิวเตอร์อยู่ใน network เดียวกัน
5. ลอง ping IP address จากเครื่องมือถือ

### CORS Error

ตรวจสอบว่า API server มีการตั้งค่า CORS headers ถูกต้อง:
```php
header("Access-Control-Allow-Origin: *");
```

### Network Request Failed

- ตรวจสอบว่าใช้ IP address แทน localhost
- ตรวจสอบว่าเครื่องมือถือและคอมพิวเตอร์อยู่ใน network เดียวกัน
- ตรวจสอบ firewall settings

