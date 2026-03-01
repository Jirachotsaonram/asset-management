# แก้ไขปัญหา PlatformConstants Error

## ปัญหาที่พบ
Error: `PlatformConstants could not be found. Verify that a module by this name is registered in the native binary.`

## สาเหตุ
- Dependencies versions ไม่ตรงกับ Expo SDK 54
- Missing peer dependencies
- Duplicate dependencies

## วิธีแก้ไข

### 1. อัปเดต Dependencies (ทำเสร็จแล้ว)
```bash
npx expo install --fix
npx expo install expo-font
```

### 2. ล้าง Cache และ Restart
```bash
# หยุด Metro bundler (Ctrl+C)

# ล้าง cache
npx expo start --clear

# หรือล้างทั้งหมด
npm cache clean --force
rm -rf node_modules
npm install
npx expo start --clear
```

### 3. อัปเดต Expo Go App
- ตรวจสอบว่า Expo Go version เป็น 54.0.6 หรือใหม่กว่า
- ไปที่ Google Play Store / App Store
- อัปเดต Expo Go ให้เป็น version ล่าสุด

### 4. Restart Development Server
```bash
# หยุด server (Ctrl+C)
npx expo start --clear
```

### 5. Reload App
- ใน Expo Go app กด "Reload" หรือกด R, R (double tap R)
- หรือสั่นมือถือเพื่อเปิด Developer Menu แล้วเลือก "Reload"

## Dependencies ที่อัปเดตแล้ว
- React: 18.3.1 → 19.1.0
- React Native: 0.76.5 → 0.81.5
- expo-status-bar: 2.0.1 → 3.0.9
- expo-image-picker: 16.0.6 → 17.0.10
- react-native-reanimated: 3.16.7 → 4.1.1
- react-native-safe-area-context: 4.12.0 → 5.6.0
- และอื่นๆ...

## หากยังมีปัญหา

### ตรวจสอบ Expo Go Version
- ตรวจสอบว่า Expo Go version ตรงกับ Expo SDK version
- Expo SDK 54 ต้องการ Expo Go 54.x.x

### ตรวจสอบ Network
- ตรวจสอบว่าโทรศัพท์และคอมพิวเตอร์อยู่ใน network เดียวกัน
- ตรวจสอบ firewall settings

### ลบและติดตั้งใหม่
```bash
# ลบ node_modules และ package-lock.json
rm -rf node_modules package-lock.json

# ติดตั้งใหม่
npm install
npx expo install --fix

# ล้าง cache และ start
npx expo start --clear
```

