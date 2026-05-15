# วิธีหาว่า IP Address ของมือถือ (เมื่อเป็น Hotspot)

## บน Android:

### วิธีที่ 1: ดูจาก Hotspot Settings
1. ไปที่ Settings
2. Network & Internet หรือ Connections
3. Hotspot & Tethering หรือ Wi-Fi Hotspot
4. ดูที่ "Hotspot name" หรือ "Wi-Fi hotspot"
5. มักจะแสดง IP address เช่น "192.168.43.1"

### วิธีที่ 2: ดูจาก About Phone
1. Settings > About phone
2. Status หรือ Phone status
3. ดูที่ IP address
4. มักจะเป็น 192.168.43.1 หรือ 192.168.x.1 (เมื่อเปิด hotspot)

### วิธีที่ 3: ดูจาก WiFi Settings (เมื่อ hotspot เปิดอยู่)
1. Settings > Network & Internet > Wi-Fi
2. ดูที่ "IP address" หรือ "Gateway"
3. มักจะเป็น 192.168.43.1

## IP Address ทั่วไป:

เมื่อมือถือ Android เปิด WiFi Hotspot IP address มักจะเป็น:
- **192.168.43.1** (Samsung, Xiaomi, OnePlus หลายรุ่น)
- **192.168.137.1** (บางรุ่น)
- **192.168.1.1** (บางรุ่น)

## ตรวจสอบว่า IP ถูกต้อง:

1. **จากมือถือที่เปิด hotspot** ดู IP address (ตามวิธีข้างบน)
2. **จาก PC** รันคำสั่ง:
   ```bash
   ipconfig
   ```
   ดูที่ "Default Gateway" ของ adapter ที่เชื่อมต่อกับมือถือ
   - IP ของ gateway = IP ของมือถือ

3. **ทดสอบ:**
   - จากมือถือ เปิดเบราว์เซอร์
   - ไปที่: `http://IP_ADDRESS/asset-management/asset_management_api/test_api.php`
   - ควรเห็นข้อมูล API

## ตัวอย่าง:

ถ้าจาก PC ดู ipconfig เห็น:
```
Ethernet adapter:
   IPv4 Address: 192.168.43.100
   Subnet Mask: 255.255.255.0
   Default Gateway: 192.168.43.1  <-- นี่คือ IP ของมือถือ
```

ให้ใช้ IP: **192.168.43.1**

