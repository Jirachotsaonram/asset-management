# แผนภาพกระแสข้อมูลระดับ 1 (Data Flow Diagram - DFD Level 1)

แผนภาพ **DFD Level 1** เป็นการเจาะลึกลงไปในแต่ละกระบวนการหลัก (จาก DFD Level 0) เพื่อดูการทำงานย่อยภายใน (Sub-processes) และการไหลของข้อมูลระหว่างกระบวนการย่อยกับ Data Store

เอกสารฉบับนี้รวบรวม DFD Level 1 ของกระบวนการหลักครบทั้ง 6 ส่วนของระบบ ได้แก่:

---

## 1. DFD Level 1 ของ Process 1.0 จัดการบัญชีและสิทธิ์

อธิบายการทำงานที่เกี่ยวข้องกับการเข้าใช้งานระบบ การจัดการบัญชีผู้ใช้ และการแก้ไขโปรไฟล์

```mermaid
graph TD
    classDef extEntity fill:#f3f4f6,stroke:#4b5563,stroke-width:2px;
    classDef process fill:#ffffff,stroke:#0f172a,stroke-width:2px,rx:15,ry:15;
    classDef datastore fill:#ffffff,stroke:#0f172a,stroke-width:2px;

    User["ผู้ใช้งานระบบ (ทุกบทบาท)"]:::extEntity
    Admin["ผู้ดูแลระบบ (Admin)"]:::extEntity

    P1_1("1.1<br/>ตรวจสอบสิทธิ์เข้าสู่ระบบ"):::process
    P1_2("1.2<br/>จัดการข้อมูลผู้ใช้งาน"):::process
    P1_3("1.3<br/>จัดการโปรไฟล์ส่วนตัว"):::process

    D1[("D1 ข้อมูลผู้ใช้งาน")]:::datastore
    D7[("D7 ข้อมูล Audit Trail / Login Log")]:::datastore

    User -- "Username/Password" --> P1_1
    P1_1 -- "สถานะการอนุญาตเข้าใช้งาน" --> User
    
    Admin -- "ข้อมูลบัญชี (เพิ่ม/ลบ/แก้ไข)" --> P1_2
    User -- "แก้ไขข้อมูลส่วนตัว" --> P1_3
    P1_3 -- "ข้อมูลโปรไฟล์อัปเดต" --> User

    P1_1 <--> |"ค้นหาและตรวจสอบรหัสผ่าน"| D1
    P1_2 <--> |"บันทึก/อัปเดตข้อมูลผู้ใช้"| D1
    P1_3 <--> |"อัปเดตข้อมูลตนเอง"| D1

    P1_1 --> |"บันทึกประวัติการ Login"| D7
```

---

## 2. DFD Level 1 ของ Process 2.0 จัดการข้อมูลพื้นฐาน

อธิบายกระบวนการจัดการข้อมูลอ้างอิงที่จำเป็นต้องใช้ในระบบ เช่น ข้อมูลแผนก อาคาร ห้อง และการเก็บประวัติเคลื่อนย้ายครุภัณฑ์

```mermaid
graph TD
    classDef extEntity fill:#f3f4f6,stroke:#4b5563,stroke-width:2px;
    classDef process fill:#ffffff,stroke:#0f172a,stroke-width:2px,rx:15,ry:15;
    classDef datastore fill:#ffffff,stroke:#0f172a,stroke-width:2px;

    Admin["ผู้ดูแลระบบ (Admin)"]:::extEntity

    P2_1("2.1<br/>จัดการหน่วยงานและสถานที่"):::process
    P2_2("2.2<br/>จัดการประวัติการเคลื่อนย้าย"):::process

    D2[("D2 ข้อมูลโครงสร้างพื้นฐาน")]:::datastore
    D4[("D4 ข้อมูลประวัติเคลื่อนย้าย")]:::datastore

    Admin -- "ข้อมูลแผนก/อาคาร/ห้อง" --> P2_1
    P2_1 -- "สถานะการบันทึกข้อมูล" --> Admin
    
    Admin -- "ข้อมูลการย้ายสถานที่ของครุภัณฑ์" --> P2_2
    P2_2 -- "ประวัติการย้าย" --> Admin

    P2_1 <--> |"บันทึก/ดึงข้อมูลสถานที่"| D2
    P2_2 <--> |"บันทึก/ดึงประวัติการเคลื่อนย้าย"| D4
```

---

## 3. DFD Level 1 ของ Process 3.0 จัดการข้อมูลครุภัณฑ์

อธิบายกระบวนการจัดการข้อมูลครุภัณฑ์ ตั้งแต่การเพิ่ม/แก้ไข การสร้างบาร์โค้ด และการนำเข้าข้อมูลชุดใหญ่ผ่าน Excel

```mermaid
graph TD
    classDef extEntity fill:#f3f4f6,stroke:#4b5563,stroke-width:2px;
    classDef process fill:#ffffff,stroke:#0f172a,stroke-width:2px,rx:15,ry:15;
    classDef datastore fill:#ffffff,stroke:#0f172a,stroke-width:2px;

    Admin["ผู้ดูแลระบบ (Admin)"]:::extEntity

    P3_1("3.1<br/>จัดการรายละเอียดครุภัณฑ์"):::process
    P3_2("3.2<br/>สร้างและพิมพ์บาร์โค้ด PDF"):::process
    P3_3("3.3<br/>นำเข้าข้อมูลจาก Excel"):::process

    D2[("D2 ข้อมูลโครงสร้างพื้นฐาน")]:::datastore
    D3[("D3 ข้อมูลครุภัณฑ์")]:::datastore
    D4[("D4 ข้อมูลประวัติเคลื่อนย้าย")]:::datastore
    D7[("D7 ข้อมูล ประวัตินำเข้า (Import Log)")]:::datastore

    Admin -- "ข้อมูลครุภัณฑ์ (เพิ่ม/แก้ไข/จำหน่าย)" --> P3_1
    
    Admin -- "คำสั่งพิมพ์/เงื่อนไขบาร์โค้ด" --> P3_2
    P3_2 -- "ไฟล์ PDF บาร์โค้ด" --> Admin
    
    Admin -- "ไฟล์ Excel ครุภัณฑ์" --> P3_3
    P3_3 -- "รายงานสรุปผลการนำเข้า" --> Admin

    P3_1 <--> |"อัปเดตข้อมูล/สถานะ"| D3
    P3_1 <-- "ตรวจสอบชื่อสังกัด/สถานที่" --> D2
    P3_1 --> |"บันทึกกรณีย้ายสถานที่"| D4
    
    P3_2 <-- "ดึงรหัสและข้อมูลมาแสดงบนป้าย" --> D3
    
    P3_3 --> |"บันทึกข้อมูลครุภัณฑ์ชุดใหญ่"| D3
    P3_3 --> |"บันทึกประวัติการนำเข้าไฟล์"| D7
```

---

## 4. DFD Level 1 ของ Process 4.0 การสำรวจและตรวจสภาพ

อธิบายการทำงานของฝั่งแอปพลิเคชันมือถือในการตรวจสภาพครุภัณฑ์ประจำปี และการจัดการรอบปีของแอดมิน

```mermaid
graph TD
    classDef extEntity fill:#f3f4f6,stroke:#4b5563,stroke-width:2px;
    classDef process fill:#ffffff,stroke:#0f172a,stroke-width:2px,rx:15,ry:15;
    classDef datastore fill:#ffffff,stroke:#0f172a,stroke-width:2px;

    Admin["ผู้ดูแลระบบ (Admin)"]:::extEntity
    Inspector["เจ้าหน้าที่ (Inspector)"]:::extEntity

    P4_1("4.1<br/>จัดการรอบการตรวจประจำปี"):::process
    P4_2("4.2<br/>ตรวจสอบสภาพด้วยมือถือ"):::process

    D3[("D3 ข้อมูลครุภัณฑ์")]:::datastore
    D5[("D5 ข้อมูลการตรวจสภาพ")]:::datastore

    Admin -- "ตั้งค่าวันที่เปิด-ปิดการตรวจปี" --> P4_1
    P4_1 <--> |"บันทึกและดึงข้อมูลรอบปี"| D5

    Inspector -- "สแกน QR Code / ค้นหาชื่อห้อง" --> P4_2
    Inspector -- "ระบุสถานะ (ปกติ/ชำรุด) และภาพถ่าย" --> P4_2
    P4_2 -- "แสดงรายละเอียดครุภัณฑ์บนแอป" --> Inspector

    P4_2 <--> |"บันทึกผลการตรวจสภาพ (Offline/Online Sync)"| D5
    P4_2 <--> |"ดึงข้อมูลเดิม และอัปเดตสถานะ"| D3
```

---

## 5. DFD Level 1 ของ Process 5.0 จัดการยืม-คืน

อธิบายเวิร์กโฟลว์การยืม-คืนครุภัณฑ์ ซึ่งมีผลกระทบโดยตรงต่อสถานะความพร้อมใช้งาน (Availability) ของครุภัณฑ์ในระบบ

```mermaid
graph TD
    classDef extEntity fill:#f3f4f6,stroke:#4b5563,stroke-width:2px;
    classDef process fill:#ffffff,stroke:#0f172a,stroke-width:2px,rx:15,ry:15;
    classDef datastore fill:#ffffff,stroke:#0f172a,stroke-width:2px;

    Inspector["เจ้าหน้าที่ (Inspector)"]:::extEntity

    P5_1("5.1<br/>ทำรายการยืม"):::process
    P5_2("5.2<br/>ทำรายการคืน"):::process

    D3[("D3 ข้อมูลครุภัณฑ์")]:::datastore
    D6[("D6 ข้อมูลการยืม-คืน")]:::datastore

    Inspector -- "ข้อมูลผู้ยืม/กำหนดคืน/รหัสครุภัณฑ์" --> P5_1
    Inspector -- "รหัสการยืม/รหัสครุภัณฑ์เพื่อส่งคืน" --> P5_2
    
    P5_1 -- "รายการยืมสำเร็จ" --> Inspector
    P5_2 -- "สถานะรับคืนสำเร็จ" --> Inspector

    P5_1 <--> |"บันทึกประวัติการยืมใหม่"| D6
    P5_1 <--> |"ตรวจสอบสถานะว่า 'ว่าง' และเปลี่ยนเป็น 'ถูกยืม'"| D3
    
    P5_2 <--> |"อัปเดตวันที่คืนจริง"| D6
    P5_2 --> |"เปลี่ยนสถานะกลับเป็น 'ปกติ'"| D3
```

---

## 6. DFD Level 1 ของ Process 6.0 แดชบอร์ดและรายงาน

อธิบายกระบวนการรวบรวมข้อมูลดิบ (Read-only) จากหลายแหล่ง เพื่อประมวลผลออกมาเป็นแดชบอร์ดสถิติ และการส่งออกรายงาน

```mermaid
graph TD
    classDef extEntity fill:#f3f4f6,stroke:#4b5563,stroke-width:2px;
    classDef process fill:#ffffff,stroke:#0f172a,stroke-width:2px,rx:15,ry:15;
    classDef datastore fill:#ffffff,stroke:#0f172a,stroke-width:2px;

    Viewer["ผู้ใช้งานระบบ (ทุกบทบาท)"]:::extEntity
    Admin["ผู้ดูแลระบบ (Admin)"]:::extEntity

    P6_1("6.1<br/>แดชบอร์ดสถิติและภาพรวม"):::process
    P6_2("6.2<br/>ดูประวัติการใช้งาน (Audit Trail)"):::process
    P6_3("6.3<br/>ส่งออกรายงานสรุปผล"):::process

    D3[("D3 ข้อมูลครุภัณฑ์")]:::datastore
    D5[("D5 ข้อมูลการตรวจสภาพ")]:::datastore
    D6[("D6 ข้อมูลการยืม-คืน")]:::datastore
    D7[("D7 ข้อมูล Audit Trail (Log)")]:::datastore

    Viewer -- "เข้าสู่หน้าแรก (Dashboard)" --> P6_1
    P6_1 -- "แสดงแผนภูมิและสถิติภาพรวม" --> Viewer

    Admin -- "เลือกดูประวัติ (ตามช่วงเวลา/ผู้ใช้)" --> P6_2
    P6_2 -- "รายการการเปลี่ยนแปลงที่เกิดขึ้นในระบบ" --> Admin

    Viewer -- "เลือกเงื่อนไขรายงาน (เช่น แผนก/ปีงบ/สถานะ)" --> P6_3
    P6_3 -- "ไฟล์รายงานส่งออก (Excel/PDF)" --> Viewer

    P6_1 <-- "นับยอดและจัดกลุ่มข้อมูล" --> D3
    P6_1 <-- "คำนวณเปอร์เซ็นต์ความคืบหน้า" --> D5
    P6_1 <-- "นับยอดการยืมค้าง" --> D6

    P6_2 <-- "ดึงข้อมูลประวัติ Log" --> D7

    P6_3 <-- "ดึงข้อมูลดิบ" --> D3
    P6_3 <-- "ดึงข้อมูลดิบ" --> D5
    P6_3 <-- "ดึงข้อมูลดิบ" --> D6
```
