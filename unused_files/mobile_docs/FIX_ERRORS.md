# แก้ไข Errors

## ปัญหาที่แก้ไขแล้ว

### 1. expo-barcode-scanner ไม่รองรับใน Expo SDK 54
- **แก้ไข**: เปลี่ยนไปใช้ `expo-camera` แทน
- **เปลี่ยนจาก**: `BarCodeScanner` จาก `expo-barcode-scanner`
- **เป็น**: `CameraView` และ `useCameraPermissions` จาก `expo-camera`

### 2. Assets folder ขาดหายไป
- **แก้ไข**: สร้าง assets folder แล้ว
- **ต้องทำ**: เพิ่มไฟล์ icon.png และ splash.png

## ไฟล์ที่แก้ไข

1. `src/screens/ScanScreen.jsx` - เปลี่ยนไปใช้ expo-camera
2. `app.json` - ลบ expo-barcode-scanner plugin
3. `package.json` - ลบ expo-barcode-scanner dependency

## ขั้นตอนถัดไป

### 1. ติดตั้ง dependencies ใหม่

```bash
cd asset-mobile
npm install
npx expo install expo-camera
```

### 2. เพิ่ม Assets (Optional แต่แนะนำ)

สร้างหรือดาวน์โหลดไฟล์ต่อไปนี้ในโฟลเดอร์ `assets/`:

- `icon.png` (1024x1024 pixels)
- `splash.png` (2048x2048 pixels)  
- `adaptive-icon.png` (1024x1024 pixels) - สำหรับ Android
- `favicon.png` - สำหรับ Web

หรือใช้ default icons ชั่วคราวโดยการ comment out ใน app.json:

```json
// "icon": "./assets/icon.png",
```

### 3. รันแอปอีกครั้ง

```bash
npm start
```

หรือ

```bash
npx expo start --clear
```

## หากยังมี Error

### ตรวจสอบ error message:

1. ดูใน terminal/console ว่า error message คืออะไร
2. ดูในแอป Expo Go ว่าแสดง error อะไร
3. ตรวจสอบ Metro bundler logs

### ล้าง cache:

```bash
npx expo start --clear
```

หรือ

```bash
npm cache clean --force
rm -rf node_modules
npm install
```

### ตรวจสอบ dependencies:

```bash
npx expo-doctor
```

คำสั่งนี้จะตรวจสอบและแนะนำการแก้ไขปัญหา dependencies

