# การตั้งค่าเมื่อใช้มือถือเป็น Hotspot

## สถานการณ์
- มือถือปล่อย WiFi (Hotspot/Tethering)
- PC เชื่อมต่อ WiFi จากมือถือ
- PC รัน API Server (XAMPP)

## วิธีที่ 1: PC เป็น Hotspot (แนะนำ) ⭐

### ขั้นตอน:
1. **PC ปล่อย WiFi Hotspot**
   - Windows 10/11: Settings > Network & Internet > Mobile Hotspot
   - เปิด Mobile Hotspot
   - ตั้งค่า Network name และ Password

2. **มือถือเชื่อมต่อ WiFi จาก PC**
   - ไปที่ WiFi settings
   - เชื่อมต่อกับ network ที่ PC ปล่อย

3. **หาว่า PC ได้ IP address อะไร**
   ```bash
   ipconfig
   ```
   มองหา "Wireless LAN adapter Local Area Connection" หรือ "Wi-Fi"
   ดู IPv4 Address (มักจะเป็น 192.168.137.x หรือ 192.168.x.x)

4. **แก้ไข API URL ใน mobile app**
   แก้ไขไฟล์ `src/utils/constants.js`:
   ```javascript
   const YOUR_IP_ADDRESS = '192.168.137.1'; // IP ของ PC ที่ปล่อย hotspot
   ```

## วิธีที่ 2: มือถือเป็น Hotspot (ต้องแก้ไขเพิ่ม)

### ขั้นตอน:
1. **มือถือปล่อย WiFi Hotspot**
   - Settings > Network & Internet > Hotspot & Tethering
   - เปิด Wi-Fi hotspot

2. **PC เชื่อมต่อ WiFi จากมือถือ**
   - เชื่อมต่อกับ network ที่มือถือปล่อย

3. **หาว่า PC ได้ IP address อะไร**
   ```bash
   ipconfig
   ```
   ดู IPv4 Address ของ adapter ที่เชื่อมต่อ

4. **หาว่ามือถือมี IP address อะไร**
   - ในมือถือ: Settings > About phone > Status > IP address
   - หรือดูจาก Hotspot settings
   - มักจะเป็น 192.168.43.1 หรือ 192.168.x.1

5. **แก้ไข API URL ใน mobile app**
   ```javascript
   const YOUR_IP_ADDRESS = '192.168.43.1'; // IP ของมือถือ (gateway)
   ```

   **แต่!** PC ที่รัน API server จะต้องเชื่อมต่อกับมือถือผ่าน hotspot นี้
   และต้องตรวจสอบว่า firewall อนุญาตการเข้าถึง

## วิธีที่ 3: ใช้ USB Tethering (แนะนำสำหรับทดสอบ)

### ขั้นตอน:
1. **เชื่อมต่อมือถือกับ PC ผ่าน USB**
2. **เปิด USB Tethering บนมือถือ**
   - Settings > Network & Internet > Hotspot & Tethering > USB Tethering
3. **PC จะได้ IP จากมือถือ**
4. **ใช้ IP ของ PC (ไม่ใช่ IP ของมือถือ)**
   ```bash
   ipconfig
   ```
   ดู IP ของ "Ethernet adapter" ที่เชื่อมต่อกับมือถือ

## วิธีที่แนะนำที่สุด

**ให้ PC ปล่อย WiFi Hotspot แล้วให้มือถือเชื่อมต่อ** เพราะ:
- PC เป็น server ที่รัน API
- การตั้งค่า firewall ง่ายกว่า
- Stable มากกว่า

## แก้ไข Mobile App

หลังจากได้ IP address แล้ว แก้ไขไฟล์ `src/utils/constants.js`:

```javascript
const YOUR_IP_ADDRESS = '192.168.137.1'; // แก้ไขเป็น IP ที่ตรวจสอบได้
```

## ทดสอบ

1. ตรวจสอบว่า PC และมือถืออยู่ใน network เดียวกัน
2. จากมือถือ เปิดเบราว์เซอร์และไปที่:
   ```
   http://YOUR_IP_ADDRESS/asset-management/asset_management_api/test_api.php
   ```
3. ถ้าเห็นข้อมูล API แสดงว่าทำงานได้
4. ลอง login ใน mobile app

## Troubleshooting

### หากไม่สามารถเข้าถึง API ได้:

1. **ตรวจสอบ Firewall:**
   - Windows Firewall > Allow an app or feature
   - อนุญาต Apache HTTP Server หรือ port 80

2. **ตรวจสอบ Network:**
   - ตรวจสอบว่า PC และมือถืออยู่ใน network เดียวกัน
   - ลอง ping IP address จากมือถือ

3. **ตรวจสอบ XAMPP:**
   - ตรวจสอบว่า Apache กำลังทำงาน
   - ตรวจสอบว่า port 80 ไม่ถูกใช้งาน

