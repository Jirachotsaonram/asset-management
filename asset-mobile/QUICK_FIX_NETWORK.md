# แก้ไข Network Error เร็วๆ

## ปัญหา
`Network Error` เมื่อพยายาม login

## วิธีแก้ไขเร็ว

### 1. ตรวจสอบ IP Address (ทำแล้ว)
IP address ของเครื่อง: **192.168.80.1**

### 2. แก้ไข API URL (แก้ไขแล้ว)
ไฟล์ `src/utils/constants.js` ถูกแก้ไขให้ใช้ IP: `192.168.80.1`

### 3. ตรวจสอบว่า API ทำงาน
เปิดเบราว์เซอร์และไปที่:
```
http://192.168.80.1/asset-management/asset_management_api/auth/login
```

ควรเห็น response จาก API

### 4. Restart Development Server
```bash
# หยุด Metro bundler (Ctrl+C)
cd asset-mobile
npx expo start --clear
```

### 5. Reload App
- ใน Expo Go app กด "RELOAD" หรือกด R, R (double tap R)

### 6. หากยังมีปัญหา

**ตรวจสอบ Firewall:**
- Windows Firewall อาจ block port 80
- อนุญาต Apache/HTTP Server ใน Firewall settings

**ตรวจสอบ Network:**
- ตรวจสอบว่าโทรศัพท์และคอมพิวเตอร์อยู่ใน network เดียวกัน
- ลอง ping IP จากโทรศัพท์

**ตรวจสอบ XAMPP:**
- ตรวจสอบว่า Apache กำลังรันอยู่
- ตรวจสอบว่า port 80 ไม่ถูกใช้งานโดยโปรแกรมอื่น

### 7. Android HTTP Security (แก้ไขแล้ว)
เพิ่ม `usesCleartextTraffic: true` ใน app.json แล้ว เพื่ออนุญาต HTTP connections บน Android

## หมายเหตุ
- หาก IP address เปลี่ยน ต้องแก้ไขใน `src/utils/constants.js` ที่ `YOUR_IP_ADDRESS`
- สำหรับ production ควรใช้ HTTPS แทน HTTP

