# แก้ไขปัญหา Network Error

## สาเหตุ
Network Error มักเกิดจาก:
1. API URL ไม่ถูกต้องหรือเข้าถึงไม่ได้
2. Android block HTTP requests (ใช้ HTTPS จำเป็นต้องใช้ HTTPS หรือตั้งค่า network security)
3. Firewall หรือ network settings

## วิธีแก้ไข

### 1. หา IP Address ของเครื่องที่รัน API Server

**Windows:**
```bash
ipconfig
```
หา IPv4 Address (มักจะเป็น 192.168.x.x หรือ 10.0.x.x)

**Mac/Linux:**
```bash
ifconfig
```

### 2. ตรวจสอบว่า API ทำงาน

เปิดเบราว์เซอร์และไปที่:
```
http://YOUR_IP_ADDRESS/asset-management/asset_management_api/auth/login
```

ควรเห็น response จาก API

### 3. แก้ไข API_BASE_URL

แก้ไขไฟล์ `src/utils/constants.js`:

```javascript
// สำหรับ Android Emulator:
export const API_BASE_URL = 'http://10.0.2.2/asset-management/asset_management_api';

// สำหรับ iOS Simulator:
export const API_BASE_URL = 'http://localhost/asset-management/asset_management_api';

// สำหรับอุปกรณ์จริง (Android/iOS):
export const API_BASE_URL = 'http://YOUR_IP_ADDRESS/asset-management/asset_management_api';
```

### 4. แก้ไข Android Network Security (สำหรับ HTTP)

สำหรับ Android ต้องอนุญาต HTTP connections

สร้างไฟล์ `android/app/src/main/AndroidManifest.xml` หรือแก้ไขไฟล์ที่มีอยู่:

เพิ่ม `android:usesCleartextTraffic="true"` ใน `<application>` tag:

```xml
<application
  android:usesCleartextTraffic="true"
  ...>
```

**หมายเหตุ:** สำหรับ Expo managed workflow อาจจะต้องใช้ config plugin

### 5. ตรวจสอบ Firewall

- ตรวจสอบว่า Windows Firewall อนุญาตการเข้าถึง port 80 (HTTP)
- ตรวจสอบว่า XAMPP/Apache กำลังรันอยู่

### 6. ตรวจสอบ Network

- ตรวจสอบว่าโทรศัพท์และคอมพิวเตอร์อยู่ใน network เดียวกัน
- ลอง ping IP address จากโทรศัพท์

## ทางเลือก: ใช้ Expo Development Build

หากยังมีปัญหา อาจจะต้องใช้ development build แทน Expo Go:

```bash
npx expo run:android
```

