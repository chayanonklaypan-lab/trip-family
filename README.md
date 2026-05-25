# 🗺️ ทริปครอบครัว — Family Trip Planner

## โครงสร้างไฟล์
```
trip-app/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx          ← หน้าหลัก + Auth + Trip selector
    ├── firebase.js      ← Firebase config + ฟังก์ชันทั้งหมด
    ├── constants.js     ← ค่าคงที่ + utils + styles
    ├── tabs/
    │   ├── OverviewTab.jsx   ← ภาพรวม + สภาพอากาศ
    │   ├── HotelsTab.jsx     ← ที่พัก + โหวต
    │   ├── PlacesTab.jsx     ← สถานที่ + โหวต + เช็คอิน
    │   ├── ExpensesTab.jsx   ← ค่าใช้จ่าย + งบ + หาร
    │   ├── ChecklistTab.jsx  ← จัดของ + template
    │   └── TimelineTab.jsx   ← ประวัติทุก action
    └── components/
        └── FAB.jsx           ← ปุ่มลัดมุมขวาล่าง
```

## ก่อน run ต้องทำอะไรบ้าง

### 1. Firebase — เพิ่ม Firestore Rules
ไปที่ Firebase Console → Firestore → Rules → วางโค้ดนี้:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /trips/{tripId}/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /templates/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /cars/{document=**} {
      allow read: if request.auth != null;
    }
  }
}
```

### 2. Firebase — เพิ่ม Authorized Domain
Firebase Console → Authentication → Settings → Authorized domains
→ เพิ่ม domain ของ Vercel ที่ได้มา

### 3. LINE — ใส่ Channel Access Token
เปิดไฟล์ src/firebase.js แล้วแก้บรรทัดนี้:
```js
const LINE_TOKEN = 'YOUR_LINE_CHANNEL_ACCESS_TOKEN'
```
ใส่ token จาก LINE Developers Console ที่ทำไว้แล้ว

### 4. ติดตั้งและรัน
```bash
npm install
npm run dev
```

### 5. Deploy Vercel
push ขึ้น GitHub แล้วเชื่อม Vercel ได้เลย
ไม่ต้องตั้ง environment variables เพราะใช้ config ตรงๆ ในโค้ด

---

## ฟีเจอร์ที่พร้อมใช้แล้ว ✅
- เข้าสู่ระบบด้วย Google
- สร้างทริป + เลือกสมาชิก + รถ + คำนวณค่าน้ำมัน + ตั้งงบ
- ที่พัก — เพิ่ม + โหวต ❤️/👍/❌ + badge 🏆
- สถานที่ — เพิ่ว + โหวต + กรองหมวด + เช็คอิน ✓ + badge 🔥
- ค่าใช้จ่าย — เพิ่ม + หาร + สรุปยอดต่อคน + แยกหมวด
- แถบงบประมาณ — ใช้แล้ว/เหลือ/เกินงบ (แดง)
- Checklist — จัดของ + บันทึก template + โหลด template ซ้ำ
- Timeline — บันทึกทุก action อัตโนมัติ
- ปุ่มลัด FAB — เพิ่มค่าใช้จ่าย/น้ำมัน/เช็คอิน 2-3 ทัป

## สิ่งที่ยังเป็น mock
- สภาพอากาศ (ใส่ OpenWeatherMap key เพิ่มได้)
- LINE Notification (ใส่ token เพิ่มได้)
