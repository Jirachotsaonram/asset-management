# ทดสอบ Network Connection

## IP Address ที่ตรวจสอบได้

จาก `ipconfig`:
- **PC IPv4 Address:** 10.103.131.243
- **Default Gateway (มือถือ):** 10.103.131.17
- **Network:** PC เชื่อมต่อกับ hotspot จากมือถือ

## วิธีทดสอบ

### 1. ทดสอบจากมือถือ (เปิดเบราว์เซอร์บนมือถือ)

เปิดเบราว์เซอร์บนมือถือและไปที่:
```
http://10.103.131.243/asset-management/asset_management_api/test_api.php
```

**ควรเห็น:**
```json
{
  "success": true,
  "message": "API ทำงานปกติ",
  "timestamp": "...",
  "server": "...",
  "ip": "...",
  "base_url": "...",
  "endpoints": {
    "login": "/auth/login (POST)",
    "assets": "/assets (GET)",
    "register": "/auth/register (POST)"
  }
}
```

### 2. หากไม่เห็นข้อมูล API

**ตรวจสอบ:**

1. **Windows Firewall:**
   - ไปที่ Windows Defender Firewall
   - Advanced Settings
   - Inbound Rules
   - ตรวจสอบว่ามี rule สำหรับ Apache/HTTP Server
   - ถ้าไม่มี ให้สร้าง rule ใหม่:
     - New Rule > Port > TCP > Specific local ports: 80
     - Allow the connection
     - Apply to all profiles
     - Name: "Allow Apache HTTP Server"

2. **ตรวจสอบ XAMPP:**
   - ตรวจสอบว่า Apache กำลังทำงาน
   - ตรวจสอบว่า port 80 ไม่ถูกใช้งาน

3. **ทดสอบจาก PC เอง:**
   ```
   http://localhost/asset-management/asset_management_api/test_api.php
   ```
   ถ้าทำงานได้จาก localhost แต่ไม่ได้จาก IP แสดงว่าเป็นปัญหา Firewall

4. **ทดสอบ ping:**
   จากมือถือ ลอง ping IP ของ PC:
   - ใช้ app เช่น "Network Tools" หรือ "Ping & DNS"
   - Ping: 10.103.131.243
   - ถ้า ping ได้แสดงว่า network เชื่อมต่อได้
   - ถ้า ping ไม่ได้อาจจะเป็น firewall หรือ network settings

### 3. หาก ping ได้แต่ API ไม่ทำงาน

อาจเป็นปัญหา Apache configuration หรือ Firewall ที่ block HTTP

**แก้ไข Firewall:**
```powershell
# อนุญาต port 80 ใน Windows Firewall
netsh advfirewall firewall add rule name="Allow Apache HTTP Server" dir=in action=allow protocol=TCP localport=80
```

### 4. ทดสอบ Login Endpoint

จากมือถือ ใช้ browser หรือ app เช่น Postman:
```
POST http://10.103.131.243/asset-management/asset_management_api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

## แก้ไข Mobile App

ไฟล์ `src/utils/constants.js` ถูกตั้งค่าให้ใช้:
```javascript
const YOUR_IP_ADDRESS = '10.103.131.243';
```

**หมายเหตุ:** ถ้า IP เปลี่ยน (เมื่อ reconnect hotspot) ต้องแก้ไขใหม่

## Restart App

หลังจากแก้ไข:
```bash
cd asset-mobile
npx expo start --clear
```

แล้ว reload app ใน Expo Go

