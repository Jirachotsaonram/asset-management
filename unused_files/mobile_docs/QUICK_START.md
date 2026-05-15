# Quick Start Guide - Asset Management Mobile App

## ขั้นตอนการติดตั้งและรันแอป

### 1. ติดตั้ง Dependencies

```bash
cd asset-mobile
npm install
```

### 2. ตั้งค่า API URL

แก้ไขไฟล์ `src/utils/constants.js`:

```javascript
export const API_BASE_URL = 'http://YOUR_IP_ADDRESS/asset-management/asset_management_api';
```

**หาว่า IP address ของคุณคืออะไร:**
- Windows: รัน `ipconfig` ใน Command Prompt
- Mac/Linux: รัน `ifconfig` ใน Terminal
- ใช้ IPv4 Address (เช่น 192.168.1.100)

### 3. รันแอป

```bash
npm start
```

จากนั้นกด:
- `a` สำหรับ Android
- `i` สำหรับ iOS
- `w` สำหรับ Web

หรือรันโดยตรง:
```bash
npm run android    # สำหรับ Android
npm run ios        # สำหรับ iOS
```

## ฟีเจอร์หลัก

### 1. หน้าแรก (Dashboard)
- แสดงสถิติครุภัณฑ์ทั้งหมด
- จำนวนครุภัณฑ์ที่ตรวจสอบแล้ว/ยังไม่ตรวจสอบ
- เมนูด่วนสำหรับเข้าถึงฟีเจอร์ต่างๆ

### 2. สแกน QR Code
- สแกน QR Code ด้วยกล้อง
- กรอกรหัสครุภัณฑ์ด้วยมือ
- บันทึกการตรวจสอบครุภัณฑ์

### 3. รายการครุภัณฑ์
- ดูรายการครุภัณฑ์ทั้งหมด
- ค้นหาครุภัณฑ์
- ดูรายละเอียดครุภัณฑ์

### 4. ตรวจสอบ
- ดูรายการครุภัณฑ์ที่ยังไม่ตรวจสอบ
- ตรวจสอบครุภัณฑ์

### 5. ยืม/คืน
- ดูประวัติการยืม-คืนครุภัณฑ์

### 6. โปรไฟล์
- ดูข้อมูลผู้ใช้
- ออกจากระบบ

## การใช้งาน

### การล็อกอิน
- ใช้ username และ password เดียวกับเว็บไซต์
- ตัวอย่าง: admin / admin123

### การสแกน QR Code
1. ไปที่หน้า "สแกน QR"
2. กดปุ่ม "สแกน QR Code"
3. อนุญาตการใช้งานกล้อง
4. สแกน QR Code บนครุภัณฑ์
5. ตรวจสอบข้อมูล
6. บันทึกการตรวจสอบ

## แก้ไขปัญหา

### แอปไม่สามารถเชื่อมต่อ API ได้
1. ตรวจสอบว่า API server กำลังทำงาน (เปิดในเบราว์เซอร์)
2. ตรวจสอบ API_BASE_URL ใน constants.js
3. ตรวจสอบว่าเครื่องมือถือและคอมพิวเตอร์อยู่ใน network เดียวกัน
4. ตรวจสอบ firewall settings

### ไม่สามารถสแกน QR Code ได้
1. ตรวจสอบว่าอนุญาตการใช้งานกล้องแล้ว
2. ไปที่ Settings > Apps > Asset Management > Permissions
3. เปิด Camera permission

### Build Error
```bash
# ลบ node_modules และติดตั้งใหม่
rm -rf node_modules
npm install

# หรือ
npm cache clean --force
npm install
```

## หมายเหตุ

- แอปนี้ใช้ Expo ซึ่งช่วยให้การพัฒนาและทดสอบง่ายขึ้น
- สำหรับ production build ใช้ EAS Build
- ตรวจสอบ README.md และ SETUP.md สำหรับรายละเอียดเพิ่มเติม

