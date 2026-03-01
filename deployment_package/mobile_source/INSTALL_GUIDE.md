# คู่มือการติดตั้ง Dependencies

## วิธีที่แนะนำ (ใช้ Expo CLI)

หลังจากตอบ **Yes** เพื่อติดตั้ง Expo แล้ว ให้รันคำสั่งต่อไปนี้:

```bash
# ให้ Expo อัปเดต dependencies ทั้งหมดให้เข้ากันกับ Expo SDK 54
npx expo install --fix
```

หรือติดตั้งทีละแพ็กเกจ:

```bash
npx expo install expo-status-bar react-native-safe-area-context react-native-screens
npx expo install @react-native-async-storage/async-storage
npx expo install expo-camera expo-barcode-scanner expo-image-picker
npx expo install react-native-gesture-handler react-native-reanimated
```

## วิธีที่ 2 (ใช้ npm ธรรมดา)

```bash
npm install
```

**หมายเหตุ:** การใช้ `npx expo install` เป็นวิธีที่แนะนำกว่าเพราะมันจะติดตั้ง versions ที่ถูกต้องตาม Expo SDK version ที่คุณใช้

## ตรวจสอบการติดตั้ง

หลังจากติดตั้งเสร็จแล้ว ให้รัน:

```bash
npm start
```

หรือ

```bash
npx expo start
```

## แก้ไขปัญหา

### หากพบ dependency conflicts:

```bash
# ลบ node_modules และ package-lock.json
rm -rf node_modules package-lock.json

# ติดตั้งใหม่
npm install
npx expo install --fix
```

### หากต้องการ downgrade กลับไปใช้ Expo SDK 51:

```bash
npm install expo@~51.0.0
npx expo install --fix
```

